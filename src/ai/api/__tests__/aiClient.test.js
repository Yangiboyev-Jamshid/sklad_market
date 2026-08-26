import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshAiAccessTokenMock, notifyAiUnauthenticatedMock } = vi.hoisted(() => ({
  refreshAiAccessTokenMock: vi.fn(),
  notifyAiUnauthenticatedMock: vi.fn(),
}));

vi.mock("../aiHttp", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  refreshAiAccessToken: refreshAiAccessTokenMock,
  notifyAiUnauthenticated: notifyAiUnauthenticatedMock,
  unwrapAi: vi.fn((value) => value),
}));

import {
  AiStreamError,
  STREAM_READ_TIMEOUT_MS,
  streamAiMessage,
} from "../aiClient";
import { setAiLocale } from "../../i18n";

const encoder = new TextEncoder();

function streamingResponse(chunks, { status = 200, neverFinish = false } = {}) {
  let index = 0;
  const reader = {
    read: vi.fn(() => {
      if (index < chunks.length) {
        const value = encoder.encode(chunks[index]);
        index += 1;
        return Promise.resolve({ value, done: false });
      }
      if (neverFinish) return new Promise(() => {});
      return Promise.resolve({ value: undefined, done: true });
    }),
    cancel: vi.fn(() => Promise.resolve()),
  };
  return {
    status,
    ok: status >= 200 && status < 300,
    body: status >= 200 && status < 300 ? { getReader: () => reader } : null,
    reader,
  };
}

describe("streamAiMessage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
    refreshAiAccessTokenMock.mockReset();
    notifyAiUnauthenticatedMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uses the website locale and stops on a terminal done event", async () => {
    localStorage.setItem("access_token", "token-1");
    setAiLocale("uz");
    const response = streamingResponse([
      'event: token\ndata: {"text":"Salom"}\n\n' +
        'event: done\ndata: {"conversationId":"c1"}\n\n',
    ], { neverFinish: true });
    fetch.mockResolvedValue(response);
    const onEvent = vi.fn();

    await streamAiMessage({ conversationId: "c1", content: "hello", onEvent });

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/ai/conversations/c1/messages",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-1",
          "Accept-Language": "UZ",
        }),
      })
    );
    expect(onEvent).toHaveBeenCalledWith({ event: "done", data: { conversationId: "c1" } });
    expect(response.reader.cancel).toHaveBeenCalledTimes(1);
  });

  it("rejects a clean EOF that has no terminal event", async () => {
    fetch.mockResolvedValue(
      streamingResponse(['event: token\ndata: {"text":"partial"}\n\n'])
    );

    await expect(
      streamAiMessage({ conversationId: "c1", content: "hello", onEvent: vi.fn() })
    ).rejects.toMatchObject({ code: "network" });
  });

  it("reports external abort as cancellation, not timeout", async () => {
    fetch.mockResolvedValue(streamingResponse([], { neverFinish: true }));
    const controller = new AbortController();
    const pending = streamAiMessage({
      conversationId: "c1",
      content: "hello",
      signal: controller.signal,
      onEvent: vi.fn(),
    });

    await Promise.resolve();
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: "cancelled" });
  });

  it("times out when no stream chunk arrives", async () => {
    vi.useFakeTimers();
    fetch.mockResolvedValue(streamingResponse([], { neverFinish: true }));
    const pending = streamAiMessage({
      conversationId: "c1",
      content: "hello",
      onEvent: vi.fn(),
    });
    const assertion = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(STREAM_READ_TIMEOUT_MS);

    await assertion;
  });

  it("refreshes only once, then invokes logout listeners after a second 401", async () => {
    fetch
      .mockResolvedValueOnce({ status: 401, ok: false, body: null })
      .mockResolvedValueOnce({ status: 401, ok: false, body: null });
    refreshAiAccessTokenMock.mockResolvedValue("new-token");

    await expect(
      streamAiMessage({ conversationId: "c1", content: "hello", onEvent: vi.fn() })
    ).rejects.toEqual(new AiStreamError("unauthenticated", "Unauthenticated"));
    expect(refreshAiAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(notifyAiUnauthenticatedMock).toHaveBeenCalledTimes(1);
  });

  it("does not hang a stream while a token refresh remains pending", async () => {
    vi.useFakeTimers();
    fetch.mockResolvedValue({ status: 401, ok: false, body: null });
    refreshAiAccessTokenMock.mockReturnValue(new Promise(() => {}));

    const pending = streamAiMessage({
      conversationId: "c1",
      content: "hello",
      onEvent: vi.fn(),
    });
    const assertion = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(STREAM_READ_TIMEOUT_MS);
    await assertion;
    expect(notifyAiUnauthenticatedMock).not.toHaveBeenCalled();
  });

  it("keeps conversation 404 distinct so the hook can recreate it", async () => {
    fetch.mockResolvedValue({ status: 404, ok: false, body: null });

    await expect(
      streamAiMessage({ conversationId: "stale", content: "hello", onEvent: vi.fn() })
    ).rejects.toMatchObject({ code: "conversation_not_found" });
  });

  it("keeps a pre-stream role quota denial typed for the chat UI", async () => {
    fetch.mockResolvedValue({
      status: 429,
      ok: false,
      body: null,
      headers: { get: () => "rate_limited" },
      json: async () => ({ success: false, message: "Hourly AI request limit reached." }),
    });

    await expect(
      streamAiMessage({ conversationId: "limited", content: "hello", onEvent: vi.fn() })
    ).rejects.toMatchObject({
      code: "rate_limited",
      message: "Hourly AI request limit reached.",
    });
  });
});
