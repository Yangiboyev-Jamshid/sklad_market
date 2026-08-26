import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAiChat } from "../useAiChat";
import { AiStreamError } from "../../api/aiClient";
import { notifyAiUnauthenticated } from "../../api/aiHttp";

const {
  createConversationMock,
  getConversationMessagesMock,
  getDraftDetailsMock,
  streamAiMessageMock,
  confirmDraftMock,
  cancelDraftMock,
  publishBuyingIntentMock,
  closeBuyingIntentMock,
} = vi.hoisted(() => ({
  createConversationMock: vi.fn(),
  getConversationMessagesMock: vi.fn(),
  getDraftDetailsMock: vi.fn(),
  streamAiMessageMock: vi.fn(),
  confirmDraftMock: vi.fn(),
  cancelDraftMock: vi.fn(),
  publishBuyingIntentMock: vi.fn(),
  closeBuyingIntentMock: vi.fn(),
}));

vi.mock("../../api/aiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createConversation: createConversationMock,
    getConversationMessages: getConversationMessagesMock,
    getDraftDetails: getDraftDetailsMock,
    streamAiMessage: streamAiMessageMock,
    confirmDraft: confirmDraftMock,
    cancelDraft: cancelDraftMock,
    publishBuyingIntent: publishBuyingIntentMock,
    closeBuyingIntent: closeBuyingIntentMock,
  };
});

describe("useAiChat", () => {
  beforeEach(() => {
    localStorage.clear();
    createConversationMock.mockReset();
    getConversationMessagesMock.mockReset().mockResolvedValue({
      items: [],
      meta: { total_pages: 1 },
    });
    getDraftDetailsMock.mockReset();
    streamAiMessageMock.mockReset();
    confirmDraftMock.mockReset();
    cancelDraftMock.mockReset();
    publishBuyingIntentMock.mockReset();
    closeBuyingIntentMock.mockReset();
    createConversationMock.mockResolvedValue({ id: "conv-1" });
  });

  it("appends the user message immediately and streams assistant tokens in", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "token", data: { text: "Hel" } });
      onEvent({ event: "token", data: { text: "lo" } });
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await act(async () => {
      await result.current.send("Hi there");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: "user", text: "Hi there" });
    expect(result.current.messages[1]).toMatchObject({ role: "assistant", text: "Hello", streaming: false });
    expect(result.current.messages[0].createdAt).toEqual(expect.any(String));
    expect(result.current.messages[1].createdAt).toEqual(expect.any(String));
    expect(result.current.activeConversationId).toBe("conv-1");
    expect(result.current.status).toBe("idle");
  });

  it("switches to a saved conversation and starts a distinct new chat without deleting history", async () => {
    getConversationMessagesMock.mockResolvedValue({
      items: [
        {
          id: "saved-user",
          role: "user",
          content: "saved prompt",
          createdAt: "2026-08-20T10:00:00Z",
        },
        {
          id: "saved-assistant",
          role: "assistant",
          content: "saved output",
          createdAt: "2026-08-20T10:00:02Z",
        },
      ],
      meta: { total_pages: 1 },
    });
    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await act(async () => {
      await result.current.selectConversation("saved-conv");
    });

    expect(result.current.activeConversationId).toBe("saved-conv");
    expect(result.current.messages).toEqual([
      expect.objectContaining({ text: "saved prompt", createdAt: "2026-08-20T10:00:00Z" }),
      expect.objectContaining({ text: "saved output", createdAt: "2026-08-20T10:00:02Z" }),
    ]);
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBe("saved-conv");

    act(() => result.current.startFreshConversation());

    expect(result.current.activeConversationId).toBeUndefined();
    expect(result.current.messages).toEqual([]);
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBeNull();
  });

  it("surfaces tool_start/tool_end events on the assistant message", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "tool_start", data: { tool: "search_products", summary: "searching" } });
      onEvent({ event: "tool_end", data: { tool: "search_products", status: "ok" } });
      onEvent({ event: "token", data: { text: "Found it" } });
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("find cement");
    });

    const assistantMessage = result.current.messages[1];
    expect(assistantMessage.toolEvents).toEqual([
      { tool: "search_products", summary: "searching", status: "ok" },
    ]);
  });

  it("reuses the same conversation id across sends (lazy creation only once)", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("first");
    });
    await act(async () => {
      await result.current.send("second");
    });

    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(streamAiMessageMock).toHaveBeenCalledTimes(2);
    expect(streamAiMessageMock.mock.calls[1][0].conversationId).toBe("conv-1");
  });

  it("sets a typed error and stops streaming when the stream rejects", async () => {
    streamAiMessageMock.mockRejectedValue(new AiStreamError("network", "boom"));

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("hello");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual({ code: "network", message: "boom" });
    expect(result.current.messages[1].streaming).toBe(false);
  });

  it("surfaces an in-stream `error` SSE event as a typed error", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "error", data: { code: "rate_limited", message: "slow down" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("hello");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual({ code: "rate_limited", message: "slow down" });
  });

  it("retryLast clears the error and resends the last user text", async () => {
    streamAiMessageMock
      .mockRejectedValueOnce(new AiStreamError("timeout", "too slow"))
      .mockImplementationOnce(async ({ onEvent }) => {
        onEvent({ event: "token", data: { text: "ok now" } });
        onEvent({ event: "done", data: { messageId: "m2", conversationId: "conv-1" } });
      });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("retry me");
    });
    expect(result.current.status).toBe("error");

    await act(async () => {
      await result.current.retryLast();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(streamAiMessageMock).toHaveBeenCalledTimes(2);
  });

  it("ignores an empty/whitespace-only message", async () => {
    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("   ");
    });
    expect(result.current.messages).toHaveLength(0);
    expect(streamAiMessageMock).not.toHaveBeenCalled();
  });

  it("blocks network sends until a stable authenticated account key exists", async () => {
    const { result } = renderHook(() => useAiChat());

    let sent;
    await act(async () => {
      sent = await result.current.send("must not leave this account-less render");
    });

    expect(sent).toBe(false);
    expect(result.current.accountReady).toBe(false);
    expect(createConversationMock).not.toHaveBeenCalled();
    expect(streamAiMessageMock).not.toHaveBeenCalled();
  });

  it("persists the conversation id in account-scoped storage and ignores the legacy global key", async () => {
    localStorage.setItem("skladx_ai_conversation_id", "legacy-other-user");
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });
    const { result } = renderHook(() => useAiChat({ accountKey: "id:42" }));
    await act(async () => {
      await result.current.send("hi");
    });
    await waitFor(() => {
      expect(localStorage.getItem("skladx_ai_conversation_id:id%3A42")).toBe("conv-1");
    });
    expect(streamAiMessageMock.mock.calls[0][0].conversationId).toBe("conv-1");
    expect(localStorage.getItem("skladx_ai_conversation_id")).toBe("legacy-other-user");
  });

  it("attaches structured result_set events and normalizes legacy buyer collections", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({
        event: "result_set",
        data: { opportunities: [{ leadId: 7, matchScore: 81 }] },
      });
      onEvent({ event: "done", data: { conversationId: "conv-1" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("find buyers");
    });

    expect(result.current.messages[1].resultSets).toMatchObject([
      { kind: "buyer_recommendations", items: [{ leadId: 7, matchScore: 81 }] },
    ]);
  });

  it("publishes an intent once and updates only its structured card", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({
        event: "result_set",
        data: {
          kind: "buying_intent_draft",
          items: [{ intentId: "intent-1", status: "DRAFT" }],
        },
      });
      onEvent({ event: "done", data: { conversationId: "conv-1" } });
    });
    publishBuyingIntentMock.mockResolvedValue({ intentId: "intent-1", status: "PUBLISHED" });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await act(async () => {
      await result.current.send("create need");
    });
    const assistantId = result.current.messages[1].id;
    await act(async () => {
      await result.current.publishBuyingIntent(assistantId, 0, "intent-1");
    });

    expect(publishBuyingIntentMock).toHaveBeenCalledWith("intent-1");
    expect(result.current.messages[1].resultSets[0].items[0]).toMatchObject({
      status: "PUBLISHED",
      actionPending: false,
      actionError: null,
    });
  });

  it("hydrates saved history and attaches canonical tool result sets to the next assistant", async () => {
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "saved-conv");
    getConversationMessagesMock.mockResolvedValue({
      items: [
        { id: "m1", role: "user", content: "old question", createdAt: "2026-08-10" },
        {
          id: "m2",
          role: "tool",
          content: "internal result",
          createdAt: "2026-08-10",
          toolName: "search_businesses",
          toolPayload: JSON.stringify({
            status: "ok",
            arguments: {},
            resultSet: {
              kind: "business_search",
              items: [
                { type: "COMPANY", id: 8, name: "Acme", contactStatus: "NOT_CHECKED" },
              ],
            },
          }),
        },
        { id: "m3", role: "assistant", content: "old answer", createdAt: "2026-08-10" },
      ],
      meta: { total_pages: 1 },
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.messages).toMatchObject([
      { role: "user", text: "old question", streaming: false },
      {
        role: "assistant",
        text: "old answer",
        streaming: false,
        resultSets: [
          {
            kind: "business_search",
            items: [
              { type: "COMPANY", id: 8, name: "Acme", contactStatus: "NOT_CHECKED" },
            ],
            invalid: false,
          },
        ],
      },
    ]);
    expect(getConversationMessagesMock).toHaveBeenCalledWith(
      "saved-conv",
      expect.objectContaining({ page: 1, per_page: 100 })
    );
    expect(createConversationMock).not.toHaveBeenCalled();
  });

  it("reloads an authoritative pending RFQ draft from an owner-scoped history reference", async () => {
    const draftId = "123e4567-e89b-42d3-a456-426614174000";
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "saved-conv");
    getConversationMessagesMock.mockResolvedValue({
      items: [
        { id: "m1", role: "user", content: "prepare an RFQ" },
        {
          id: "m2",
          role: "tool",
          toolPayload: JSON.stringify({
            status: "ok",
            arguments: {},
            draftRef: { draftId, type: "LEAD" },
          }),
        },
        { id: "m3", role: "assistant", content: "Review and confirm the draft." },
      ],
      meta: { total_pages: 1 },
    });
    getDraftDetailsMock.mockResolvedValue({
      draftId,
      type: "LEAD",
      status: "DRAFT",
      payload: {
        companyName: "Acme",
        quantity: 3,
        items: [{ slug: "cement", name: "Cement", price: 15000, currency: "UZS" }],
      },
      expiresAt: "2026-08-12T00:00:00Z",
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(getDraftDetailsMock).toHaveBeenCalledWith(
      draftId,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result.current.messages[1].draft).toEqual({
      draftId,
      type: "LEAD",
      status: "pending",
      payload: {
        companyName: "Acme",
        quantity: 3,
        items: [{ slug: "cement", name: "Cement", price: 15000, currency: "UZS" }],
      },
      expiresAt: "2026-08-12T00:00:00Z",
    });
  });

  it("blocks history and allows retry when pending-draft recovery fails transiently", async () => {
    const draftId = "123e4567-e89b-42d3-a456-426614174000";
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "saved-conv");
    getConversationMessagesMock.mockResolvedValue({
      items: [
        {
          id: "m2",
          role: "tool",
          toolPayload: JSON.stringify({ draftRef: { draftId, type: "LEAD" } }),
        },
        { id: "m3", role: "assistant", content: "Review the draft." },
      ],
      meta: { total_pages: 1 },
    });
    const unavailable = new Error("draft service unavailable");
    unavailable.status = 503;
    getDraftDetailsMock
      .mockRejectedValueOnce(unavailable)
      .mockResolvedValueOnce({
        draftId,
        type: "LEAD",
        status: "DRAFT",
        payload: { companyName: "Recovered company" },
      });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatchObject({ code: "history_unavailable" });
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBe("saved-conv");

    await act(async () => {
      await result.current.retryHistory();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.messages[0].draft).toMatchObject({
      draftId,
      status: "pending",
      payload: { companyName: "Recovered company" },
    });
  });

  it.each(["CONFIRMED", "CANCELLED", "EXPIRED"])(
    "does not restore Confirm/Cancel actions for a %s RFQ draft",
    async (status) => {
      const draftId = "123e4567-e89b-42d3-a456-426614174000";
      localStorage.setItem("skladx_ai_conversation_id:buyer-1", "saved-conv");
      getConversationMessagesMock.mockResolvedValue({
        items: [
          {
            id: "m2",
            role: "tool",
            toolPayload: JSON.stringify({
              status: "ok",
              arguments: {},
              draftRef: { draftId, type: "LEAD" },
            }),
          },
          { id: "m3", role: "assistant", content: "Draft status" },
        ],
        meta: { total_pages: 1 },
      });
      getDraftDetailsMock.mockResolvedValue({
        draftId,
        type: "LEAD",
        status,
        payload: { companyName: "Must not become actionable" },
      });

      const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

      await waitFor(() => expect(result.current.status).toBe("idle"));
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].draft).toBeUndefined();
    }
  );

  it("prioritizes the newest draft references when history exceeds the lookup cap", async () => {
    const draftId = (index) =>
      `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "many-drafts");
    getConversationMessagesMock.mockResolvedValue({
      items: Array.from({ length: 21 }, (_, index) => ({
        id: `tool-${index}`,
        role: "tool",
        toolPayload: JSON.stringify({
          status: "ok",
          arguments: {},
          draftRef: { draftId: draftId(index), type: "LEAD" },
        }),
      })),
      meta: { total_pages: 1 },
    });
    getDraftDetailsMock.mockImplementation(async (id) => ({
      draftId: id,
      type: "LEAD",
      status: "EXPIRED",
      payload: {},
    }));

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await waitFor(() => expect(result.current.status).toBe("idle"));
    const requestedIds = getDraftDetailsMock.mock.calls.map(([id]) => id);
    expect(requestedIds).toHaveLength(20);
    expect(requestedIds).not.toContain(draftId(0));
    expect(requestedIds).toContain(draftId(20));
  });

  it("ignores malformed and pre-contract historical tool payloads", async () => {
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "saved-conv");
    getConversationMessagesMock.mockResolvedValue({
      items: [
        { id: "m1", role: "user", content: "old question" },
        { id: "m2", role: "tool", toolPayload: "{not-json" },
        {
          id: "m3",
          role: "tool",
          toolPayload: JSON.stringify({ kind: "business_search", items: [{ id: 1 }] }),
        },
        { id: "m4", role: "assistant", content: "old answer" },
      ],
      meta: { total_pages: 1 },
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].resultSets).toEqual([]);
  });

  it("keeps a transiently unavailable history blocked and retries the same conversation", async () => {
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "hidden-old-conv");
    getConversationMessagesMock
      .mockRejectedValueOnce(new Error("history gateway unavailable"))
      .mockResolvedValueOnce({
        items: [{ id: "old-answer", role: "assistant", content: "restored history" }],
        meta: { total_pages: 1 },
      });
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "done", data: { conversationId: "conv-1" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatchObject({ code: "history_unavailable" });
    expect(result.current.messages).toEqual([]);
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBe("hidden-old-conv");

    await act(async () => {
      expect(await result.current.send("must stay blocked")).toBe(false);
    });
    expect(createConversationMock).not.toHaveBeenCalled();
    expect(streamAiMessageMock).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.retryHistory();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.messages[0]).toMatchObject({ text: "restored history" });
    expect(getConversationMessagesMock).toHaveBeenLastCalledWith(
      "hidden-old-conv",
      expect.objectContaining({ page: 1 })
    );
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBe("hidden-old-conv");
  });

  it("starts fresh only after the user explicitly clears an unavailable history pointer", async () => {
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "hidden-old-conv");
    getConversationMessagesMock.mockRejectedValue(new Error("history gateway unavailable"));
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "done", data: { conversationId: "conv-1" } });
    });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.startFreshConversation());
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBeNull();

    await act(async () => {
      await result.current.send("start visibly fresh");
    });
    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(streamAiMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv-1", content: "start visibly fresh" })
    );
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBe("conv-1");
  });

  it("caps oversized history and hydrates the newest bounded page window", async () => {
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "large-conv");
    getConversationMessagesMock.mockImplementation((_conversationId, { page }) => ({
      items: [{ id: `m-${page}`, role: "assistant", content: `page-${page}` }],
      meta: { total_pages: 25 },
    }));

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    await waitFor(() => expect(result.current.status).toBe("idle"));
    const requestedPages = getConversationMessagesMock.mock.calls.map((call) => call[1].page);
    expect(requestedPages).toEqual([1, ...Array.from({ length: 20 }, (_, index) => index + 6)]);
    expect(result.current.messages).toHaveLength(20);
    expect(result.current.messages[0].text).toBe("page-6");
    expect(result.current.messages.at(-1).text).toBe("page-25");
  });

  it("recreates a stale conversation once and does not duplicate the optimistic user message", async () => {
    localStorage.setItem("skladx_ai_conversation_id:buyer-1", "stale-conv");
    createConversationMock.mockResolvedValue({ id: "fresh-conv" });
    streamAiMessageMock
      .mockRejectedValueOnce(new AiStreamError("conversation_not_found", "gone"))
      .mockImplementationOnce(async ({ onEvent }) => {
        onEvent({ event: "token", data: { text: "fresh answer" } });
        onEvent({ event: "done", data: { conversationId: "fresh-conv" } });
      });

    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    await act(async () => {
      await result.current.send("one question");
    });

    expect(streamAiMessageMock).toHaveBeenCalledTimes(2);
    expect(streamAiMessageMock.mock.calls[0][0].conversationId).toBe("stale-conv");
    expect(streamAiMessageMock.mock.calls[1][0].conversationId).toBe("fresh-conv");
    expect(result.current.messages.filter((message) => message.role === "user")).toHaveLength(1);
    expect(result.current.messages[1]).toMatchObject({ text: "fresh answer", streaming: false });
    expect(localStorage.getItem("skladx_ai_conversation_id:buyer-1")).toBe("fresh-conv");
  });

  it("uses a synchronous lock to reject two sends fired before React can rerender", async () => {
    let finishStream;
    streamAiMessageMock.mockImplementation(
      ({ onEvent }) =>
        new Promise((resolve) => {
          finishStream = () => {
            onEvent({ event: "done", data: { conversationId: "conv-1" } });
            resolve();
          };
        })
    );
    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));

    let firstSend;
    let secondResult;
    await act(async () => {
      firstSend = result.current.send("first");
      secondResult = await result.current.send("second");
    });
    expect(secondResult).toBe(false);
    expect(streamAiMessageMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishStream();
      await firstSend;
    });
    expect(result.current.messages.filter((message) => message.role === "user")).toHaveLength(1);
    expect(result.current.messages[0].text).toBe("first");
  });

  it("aborts and resets on account switch, ignoring events from the old stream", async () => {
    let oldStreamArgs;
    streamAiMessageMock.mockImplementation(
      (args) =>
        new Promise((resolve, reject) => {
          oldStreamArgs = args;
          args.signal.addEventListener(
            "abort",
            () => reject(new AiStreamError("cancelled", "account changed")),
            { once: true }
          );
        })
    );
    const { result, rerender } = renderHook(
      ({ accountKey }) => useAiChat({ accountKey }),
      { initialProps: { accountKey: "buyer-a" } }
    );

    let pendingSend;
    act(() => {
      pendingSend = result.current.send("from A");
    });
    await waitFor(() => expect(result.current.status).toBe("streaming"));

    rerender({ accountKey: "buyer-b" });
    expect(result.current.messages).toEqual([]);
    await waitFor(() => expect(oldStreamArgs.signal.aborted).toBe(true));
    act(() => {
      oldStreamArgs.onEvent({ event: "token", data: { text: "stale" } });
      oldStreamArgs.onEvent({ event: "done", data: {} });
    });
    await pendingSend;

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.messages).toEqual([]);
  });

  it("forwards unrecoverable AI authentication failures to the supplied logout callback", () => {
    const logout = vi.fn();
    renderHook(() =>
      useAiChat({ accountKey: "buyer-1", onUnauthenticated: logout })
    );

    act(() => notifyAiUnauthenticated());

    expect(logout).toHaveBeenCalledTimes(1);
  });

  describe("draft events and confirm/cancel", () => {
    async function sendWithDraft() {
      streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
        onEvent({
          event: "draft",
          data: { draftId: "draft-1", type: "LEAD", payload: { contactName: "Ali" } },
        });
        onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
      });
    const { result } = renderHook(() => useAiChat({ accountKey: "buyer-1" }));
      await act(async () => {
        await result.current.send("draft a lead");
      });
      return result;
    }

    it("attaches the draft payload to the assistant message as a pending draft", async () => {
      const result = await sendWithDraft();

      const assistantMessage = result.current.messages[1];
      expect(assistantMessage.draft).toEqual({
        draftId: "draft-1",
        type: "LEAD",
        payload: { contactName: "Ali" },
        status: "pending",
      });
    });

    it("confirmDraft marks the draft confirmed with the returned leadId", async () => {
      const result = await sendWithDraft();
      const assistantId = result.current.messages[1].id;
      confirmDraftMock.mockResolvedValue({ leadId: 101, status: "CONFIRMED" });

      await act(async () => {
        await result.current.confirmDraft(assistantId, "draft-1", { contactPhone: "+998900000000" });
      });

      expect(confirmDraftMock).toHaveBeenCalledWith("draft-1", { contactPhone: "+998900000000" });
      expect(result.current.messages[1].draft).toMatchObject({ status: "confirmed", leadId: 101, pending: false });
    });

    it("cancelDraft marks the draft cancelled", async () => {
      const result = await sendWithDraft();
      const assistantId = result.current.messages[1].id;
      cancelDraftMock.mockResolvedValue({ status: "CANCELLED" });

      await act(async () => {
        await result.current.cancelDraft(assistantId, "draft-1");
      });

      expect(cancelDraftMock).toHaveBeenCalledWith("draft-1");
      expect(result.current.messages[1].draft).toMatchObject({ status: "cancelled", pending: false });
    });

    it("a failed confirm keeps the draft pending and records an inline error instead of throwing", async () => {
      const result = await sendWithDraft();
      const assistantId = result.current.messages[1].id;
      confirmDraftMock.mockRejectedValue(new Error("This draft has expired."));

      await act(async () => {
        await result.current.confirmDraft(assistantId, "draft-1");
      });

      expect(result.current.messages[1].draft).toMatchObject({
        status: "pending",
        pending: false,
        error: "This draft has expired.",
      });
    });
  });
});
