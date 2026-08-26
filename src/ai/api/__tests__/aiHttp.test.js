import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import sharedHttp from "../../../api/http";
import { refreshAccessToken } from "../../../api/api";
import aiHttp, {
  AI_JSON_TIMEOUT_MS,
  AI_GENERATION_TIMEOUT_MS,
  AI_REFRESH_TIMEOUT_MS,
  AI_UPLOAD_TIMEOUT_MS,
  notifyAiUnauthenticated,
  onAiUnauthenticated,
} from "../aiHttp";
import {
  cancelDraft,
  confirmDraft,
  closeBuyingIntent,
  createConversation,
  deleteConversation,
  deleteListingImage,
  getConversationMessages,
  getDraftDetails,
  getSimilarProducts,
  listConversations,
  publishBuyingIntent,
  searchBusinesses,
  suggestListing,
  uploadListingImage,
} from "../aiClient";
import { setAiLocale } from "../../i18n";

function success(config, data = {}) {
  return Promise.resolve({
    data: { success: true, data },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  });
}

function unauthorized(config) {
  return Promise.reject({
    message: "Unauthorized",
    config,
    response: { status: 401, data: { message: "Unauthorized" }, config },
  });
}

function header(config, name) {
  return config.headers?.get?.(name) ?? config.headers?.[name];
}

describe("AI-owned HTTP client", () => {
  let originalAdapter;
  let originalSharedAdapter;

  beforeEach(() => {
    localStorage.clear();
    setAiLocale("ru");
    originalAdapter = aiHttp.defaults.adapter;
    originalSharedAdapter = sharedHttp.defaults.adapter;
  });

  afterEach(() => {
    aiHttp.defaults.adapter = originalAdapter;
    sharedHttp.defaults.adapter = originalSharedAdapter;
    vi.restoreAllMocks();
  });

  it("applies the selected AI locale and token to every JSON/upload operation", async () => {
    setAiLocale("en");
    localStorage.setItem("access_token", "access-1");
    const configs = [];
    aiHttp.defaults.adapter = (config) => {
      configs.push(config);
      return success(config, { id: "value" });
    };

    await createConversation();
    await listConversations();
    await getConversationMessages("conversation-1");
    await deleteConversation("conversation-1");
    await confirmDraft("draft-1");
    await cancelDraft("draft-1");
    await publishBuyingIntent("intent-1");
    await closeBuyingIntent("intent-1");
    await suggestListing({ description: "cement", imageIds: [] });
    await uploadListingImage(new File(["image"], "cement.jpg", { type: "image/jpeg" }));
    await deleteListingImage("temporary/image.jpg");
    await getDraftDetails("123e4567-e89b-42d3-a456-426614174000");

    expect(configs).toHaveLength(12);
    expect(JSON.parse(configs[6].data)).toEqual({ publicationConsent: true });
    for (const config of configs.filter((_config, index) => index !== 8 && index !== 9)) {
      expect(header(config, "Accept-Language")).toBe("EN");
      expect(header(config, "Authorization")).toBe("Bearer access-1");
      expect(config.timeout).toBe(AI_JSON_TIMEOUT_MS);
    }
    expect(configs[8].timeout).toBe(AI_GENERATION_TIMEOUT_MS);
    expect(header(configs[8], "Accept-Language")).toBe("EN");
    expect(header(configs[8], "Authorization")).toBe("Bearer access-1");
    expect(configs[9].timeout).toBe(AI_UPLOAD_TIMEOUT_MS);
    expect(header(configs[9], "Accept-Language")).toBe("EN");
    expect(header(configs[9], "Authorization")).toBe("Bearer access-1");
    expect(configs[10].url).toBe("/attach/delete/temporary%2Fimage.jpg");
    expect(configs[11].url).toBe("/ai/drafts/123e4567-e89b-42d3-a456-426614174000");
  });

  it("calls the bounded, read-only business search endpoint", async () => {
    setAiLocale("uz");
    localStorage.setItem("access_token", "access-business");
    let captured;
    aiHttp.defaults.adapter = (config) => {
      captured = config;
      return success(config, { items: [] });
    };

    await searchBusinesses({ query: "  cement  ", limit: 99 });

    expect(captured.url).toBe("/ai/business-search");
    expect(captured.method).toBe("get");
    expect(captured.params).toEqual({ q: "cement", types: "PRODUCT,COMPANY", limit: 12 });
    expect(header(captured, "Accept-Language")).toBe("UZ");
    expect(header(captured, "Authorization")).toBe("Bearer access-business");
  });

  it("calls the bounded similar-products recommender", async () => {
    let captured;
    aiHttp.defaults.adapter = (config) => {
      captured = config;
      return success(config, { items: [] });
    };

    await getSimilarProducts(42, { limit: 99 });

    expect(captured.url).toBe("/ai/similar/42");
    expect(captured.method).toBe("get");
    expect(captured.params).toEqual({ limit: 12 });
  });

  it("refreshes a failed JSON request once and calls the logout listener after a final 401", async () => {
    localStorage.setItem("refresh_token", "refresh-1");
    const logout = vi.fn();
    const unsubscribe = onAiUnauthenticated(logout);
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "access-2", refreshToken: "refresh-2" } },
    });
    let attempts = 0;
    aiHttp.defaults.adapter = (config) => {
      attempts += 1;
      return attempts === 1 ? unauthorized(config) : success(config, { id: "conversation-1" });
    };

    await expect(createConversation()).resolves.toEqual({ id: "conversation-1" });
    expect(attempts).toBe(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
    expect(localStorage.getItem("access_token")).toBe("access-2");

    attempts = 0;
    aiHttp.defaults.adapter = (config) => {
      attempts += 1;
      return unauthorized(config);
    };
    await expect(createConversation()).rejects.toMatchObject({ status: 401 });
    expect(attempts).toBe(2);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenLastCalledWith(
      "/api/v1/auth/refresh",
      { refreshToken: "refresh-2" },
      {
        timeout: AI_REFRESH_TIMEOUT_MS,
        headers: { "Accept-Language": "RU" },
      }
    );
    expect(logout).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("shares one refresh POST across standalone, ordinary HTTP, and AI requests", async () => {
    localStorage.setItem("access_token", "access-1");
    localStorage.setItem("refresh_token", "refresh-1");
    let finishRefresh;
    const refresh = vi.spyOn(axios, "post").mockImplementation(
      () => new Promise((resolve) => {
        finishRefresh = resolve;
      })
    );
    let sharedAttempts = 0;
    let aiAttempts = 0;
    sharedHttp.defaults.adapter = (config) => {
      sharedAttempts += 1;
      return header(config, "Authorization") === "Bearer access-2"
        ? success(config, { ok: true })
        : unauthorized(config);
    };
    aiHttp.defaults.adapter = (config) => {
      aiAttempts += 1;
      return header(config, "Authorization") === "Bearer access-2"
        ? success(config, { id: "conversation-1" })
        : unauthorized(config);
    };

    const standaloneRefresh = refreshAccessToken();
    const ordinaryRequest = sharedHttp.get("/products/poll");
    const aiRequest = createConversation();
    await vi.waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(sharedAttempts).toBe(1);
      expect(aiAttempts).toBe(1);
    });

    finishRefresh({
      data: { data: { accessToken: "access-2", refreshToken: "refresh-2" } },
    });

    await expect(standaloneRefresh).resolves.toBeDefined();
    await vi.waitFor(() => {
      expect(sharedAttempts).toBe(2);
      expect(aiAttempts).toBe(2);
    });
    await expect(Promise.all([ordinaryRequest, aiRequest])).resolves.toBeDefined();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sharedAttempts).toBe(2);
    expect(aiAttempts).toBe(2);
    expect(localStorage.getItem("access_token")).toBe("access-2");
    expect(localStorage.getItem("refresh_token")).toBe("refresh-2");
    expect(refresh).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      { refreshToken: "refresh-1" },
      expect.objectContaining({
        timeout: AI_REFRESH_TIMEOUT_MS,
        headers: expect.objectContaining({ "Accept-Language": expect.any(String) }),
      })
    );
  });

  it("delivers a failed-session notification to a listener that mounts later only for that token", () => {
    localStorage.setItem("access_token", "failed-token-late-listener");
    notifyAiUnauthenticated();

    const lateListener = vi.fn();
    const unsubscribe = onAiUnauthenticated(lateListener);
    expect(lateListener).toHaveBeenCalledTimes(1);
    unsubscribe();

    localStorage.setItem("access_token", "new-session-token");
    const newSessionListener = vi.fn();
    const unsubscribeNewSession = onAiUnauthenticated(newSessionListener);
    expect(newSessionListener).not.toHaveBeenCalled();
    unsubscribeNewSession();
  });
});
