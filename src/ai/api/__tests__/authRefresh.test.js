import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  AUTH_REFRESH_STALE_SESSION,
  AUTH_REFRESH_TIMEOUT_MS,
  refreshAccessTokenSingleflight,
} from "../../../api/authRefresh";

function cachedUser(username = "buyer", role = "BUYER") {
  localStorage.setItem("skladx_user", JSON.stringify({ username, role }));
}

describe("shared authentication refresh", () => {
  beforeEach(() => {
    localStorage.clear();
    cachedUser();
    localStorage.setItem("access_token", "access-1");
    localStorage.setItem("refresh_token", "refresh-1");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("coalesces concurrent callers into one bounded refresh request", async () => {
    let finishRefresh;
    const post = vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((resolve) => {
        finishRefresh = resolve;
      })
    );

    const first = refreshAccessTokenSingleflight({ acceptLanguage: "en" });
    const second = refreshAccessTokenSingleflight({ acceptLanguage: "uz" });
    expect(first).toBe(second);
    expect(post).toHaveBeenCalledTimes(1);

    finishRefresh({
      data: { data: { accessToken: "access-2", refreshToken: "refresh-2" } },
    });
    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ accessToken: "access-2" }),
      expect.objectContaining({ accessToken: "access-2" }),
    ]);
    expect(post).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      { refreshToken: "refresh-1" },
      {
        timeout: AUTH_REFRESH_TIMEOUT_MS,
        headers: { "Accept-Language": "EN" },
      }
    );
  });

  it("does not let a late response overwrite a newer same-session refresh", async () => {
    let finishRefresh;
    vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((resolve) => {
        finishRefresh = resolve;
      })
    );

    const request = refreshAccessTokenSingleflight();
    localStorage.setItem("access_token", "winner-access");
    localStorage.setItem("refresh_token", "winner-refresh");
    finishRefresh({
      data: { data: { accessToken: "late-access", refreshToken: "late-refresh" } },
    });

    await expect(request).resolves.toMatchObject({
      accessToken: "winner-access",
      refreshToken: "winner-refresh",
      recovered: true,
    });
    expect(localStorage.getItem("access_token")).toBe("winner-access");
    expect(localStorage.getItem("refresh_token")).toBe("winner-refresh");
  });

  it("recovers the current same-session token when the older refresh request fails", async () => {
    let failRefresh;
    vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((_resolve, reject) => {
        failRefresh = reject;
      })
    );

    const request = refreshAccessTokenSingleflight();
    localStorage.setItem("access_token", "winner-access");
    localStorage.setItem("refresh_token", "winner-refresh");
    failRefresh(new Error("old request failed"));

    await expect(request).resolves.toMatchObject({
      accessToken: "winner-access",
      refreshToken: "winner-refresh",
      recovered: true,
    });
  });

  it("rejects a late response from another account without touching the new session", async () => {
    let finishRefresh;
    vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((resolve) => {
        finishRefresh = resolve;
      })
    );

    const request = refreshAccessTokenSingleflight();
    cachedUser("seller", "SELLER");
    localStorage.setItem("access_token", "seller-access");
    localStorage.setItem("refresh_token", "seller-refresh");
    finishRefresh({
      data: { data: { accessToken: "late-access", refreshToken: "late-refresh" } },
    });

    await expect(request).rejects.toMatchObject({ code: AUTH_REFRESH_STALE_SESSION });
    expect(localStorage.getItem("access_token")).toBe("seller-access");
    expect(localStorage.getItem("refresh_token")).toBe("seller-refresh");
  });
});
