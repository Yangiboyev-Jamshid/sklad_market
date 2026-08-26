import { useReducer, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import {
  createConversation,
  getConversationMessages,
  getDraftDetails,
  streamAiMessage,
  confirmDraft as confirmDraftRequest,
  cancelDraft as cancelDraftRequest,
  publishBuyingIntent as publishBuyingIntentRequest,
  closeBuyingIntent as closeBuyingIntentRequest,
  AiStreamError,
} from "../api/aiClient";
import { onAiUnauthenticated } from "../api/aiHttp";
import {
  normalizeResultSet,
  normalizeResultSets,
  updateIntentInResultSet,
} from "../lib/resultSets";

const CONVERSATION_STORAGE_PREFIX = "skladx_ai_conversation_id:";
const HISTORY_PAGE_SIZE = 100;
const HISTORY_MAX_PAGES = 20;
const HISTORY_MAX_MESSAGES = HISTORY_PAGE_SIZE * HISTORY_MAX_PAGES;
const HISTORY_LOAD_TIMEOUT_MS = 30_000;
const HISTORY_MAX_DRAFT_REFS = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const initialState = {
  status: "idle", // idle | hydrating | streaming | error
  messages: [],
  error: null,
  usage: null,
  lastText: null,
};

function updateMessage(messages, id, updater) {
  return messages.map((message) => (message.id === id ? updater(message) : message));
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE_START":
      return { ...initialState, status: "hydrating" };
    case "HYDRATE_SUCCESS":
      return { ...initialState, messages: action.messages };
    case "HYDRATE_FAILURE":
      return {
        ...initialState,
        status: "error",
        error: { code: "history_unavailable", message: action.message },
      };
    case "SEND":
      return {
        ...state,
        status: "streaming",
        error: null,
        lastText: action.text,
        messages: [
          ...state.messages,
          {
            id: action.userId,
            role: "user",
            text: action.text,
            createdAt: action.createdAt,
          },
          {
            id: action.assistantId,
            role: "assistant",
            text: "",
            toolEvents: [],
            resultSets: [],
            streaming: true,
          },
        ],
      };
    case "TOKEN":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          text: message.text + action.text,
        })),
      };
    case "TOOL_START":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          toolEvents: [
            ...message.toolEvents,
            { tool: action.tool, summary: action.summary, status: "running" },
          ],
        })),
      };
    case "TOOL_END":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          toolEvents: message.toolEvents.map((toolEvent) =>
            toolEvent.tool === action.tool && toolEvent.status === "running"
              ? { ...toolEvent, status: action.status }
              : toolEvent
          ),
        })),
      };
    case "DRAFT":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          draft: {
            draftId: action.draftId,
            type: action.draftType,
            payload: action.payload,
            status: "pending",
          },
        })),
      };
    case "RESULT_SET":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          resultSets: [...(message.resultSets ?? []), action.resultSet],
        })),
      };
    case "RESULT_ACTION_START":
    case "RESULT_ACTION_SUCCESS":
    case "RESULT_ACTION_ERROR":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          resultSets: (message.resultSets ?? []).map((resultSet, index) => {
            if (index !== action.resultSetIndex) return resultSet;
            const actionState =
              action.type === "RESULT_ACTION_START"
                ? { actionPending: true, actionError: null }
                : action.type === "RESULT_ACTION_ERROR"
                  ? { actionPending: false, actionError: action.error }
                  : {
                      ...action.result,
                      actionPending: false,
                      actionError: null,
                    };
            return updateIntentInResultSet(resultSet, action.intentId, actionState);
          }),
        })),
      };
    case "DRAFT_ACTION_START":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) =>
          message.draft
            ? { ...message, draft: { ...message.draft, pending: true, error: null } }
            : message
        ),
      };
    case "DRAFT_CONFIRMED":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) =>
          message.draft
            ? {
                ...message,
                draft: {
                  ...message.draft,
                  status: "confirmed",
                  leadId: action.leadId,
                  pending: false,
                  error: null,
                },
              }
            : message
        ),
      };
    case "DRAFT_CANCELLED":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) =>
          message.draft
            ? {
                ...message,
                draft: {
                  ...message.draft,
                  status: "cancelled",
                  pending: false,
                  error: null,
                },
              }
            : message
        ),
      };
    case "DRAFT_ACTION_ERROR":
      return {
        ...state,
        messages: updateMessage(state.messages, action.assistantId, (message) =>
          message.draft
            ? {
                ...message,
                draft: { ...message.draft, pending: false, error: action.error },
              }
            : message
        ),
      };
    case "USAGE":
      return { ...state, usage: action.usage };
    case "DONE":
      return {
        ...state,
        status: "idle",
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          streaming: false,
          createdAt: action.createdAt ?? message.createdAt,
        })),
      };
    case "STREAM_ERROR_EVENT":
      return {
        ...state,
        status: "error",
        error: action.error,
        messages: updateMessage(state.messages, action.assistantId, (message) => ({
          ...message,
          streaming: false,
        })),
      };
    case "FAILURE":
      return {
        ...state,
        status: "error",
        error: action.error,
        messages: action.assistantId
          ? updateMessage(state.messages, action.assistantId, (message) => ({
              ...message,
              streaming: false,
            }))
          : state.messages,
      };
    case "CLEAR_ERROR":
      return { ...state, status: "idle", error: null };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

function replaceValue(_current, next) {
  return next;
}

let idSequence = 0;
function nextId() {
  idSequence += 1;
  return `ai-msg-${Date.now()}-${idSequence}`;
}

function normalizeAccountKey(accountKey) {
  if (accountKey === undefined || accountKey === null || accountKey === "") return null;
  return String(accountKey);
}

function storageKey(accountKey) {
  return accountKey
    ? `${CONVERSATION_STORAGE_PREFIX}${encodeURIComponent(accountKey)}`
    : null;
}

function readStoredConversationId(accountKey) {
  const key = storageKey(accountKey);
  if (!key) return undefined;
  try {
    return localStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

function storeConversationId(accountKey, conversationId) {
  const key = storageKey(accountKey);
  if (!key) return;
  try {
    localStorage.setItem(key, conversationId);
  } catch {
    // The conversation remains usable for this mounted session.
  }
}

function removeStoredConversationId(accountKey, expectedId) {
  const key = storageKey(accountKey);
  if (!key) return;
  try {
    if (!expectedId || localStorage.getItem(key) === expectedId) localStorage.removeItem(key);
  } catch {
    // Nothing else to clean up.
  }
}

function isCancelled(error) {
  return error?.code === "cancelled" || error?.code === "ERR_CANCELED";
}

function historyMessage(message) {
  const role = String(message?.role ?? "").toLowerCase();
  if (role !== "user" && role !== "assistant") return null;
  return {
    id: message.id ? `history-${message.id}` : nextId(),
    role,
    text: message.content ?? "",
    toolEvents: [],
    resultSets: normalizeResultSets(message.resultSets ?? message.structuredResults),
    streaming: false,
    createdAt: message.createdAt,
  };
}

function historicalToolEnvelope(message) {
  const raw = message?.toolPayload;
  if (raw === undefined || raw === null) return null;
  let payload = raw;
  if (typeof raw === "string") {
    if (raw.length > 250_000) return null;
    try {
      payload = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload;
}

function historicalToolResult(payload) {
  if (!payload) return null;
  // History accepts only the new canonical envelope. Older raw tool payloads are intentionally
  // ignored because their field-level privacy and rendering contract was not guaranteed.
  const canonical = payload.resultSet;
  if (!canonical || typeof canonical !== "object" || !Array.isArray(canonical.items)) return null;
  const normalized = normalizeResultSet(canonical);
  return normalized.invalid ? null : normalized;
}

function historicalDraftRef(payload) {
  const ref = payload?.draftRef;
  if (!ref || typeof ref !== "object" || Array.isArray(ref)) return null;
  const draftId = String(ref.draftId ?? "").trim();
  const type = String(ref.type ?? "").trim().toUpperCase();
  if (!UUID_PATTERN.test(draftId) || type !== "LEAD") return null;
  return { draftId, type };
}

async function loadPendingHistoricalDrafts(rawMessages, signal) {
  const refs = new Map();
  // History is oldest-first; walk backward so the bounded lookup budget restores the newest
  // potentially actionable drafts rather than spending it on old terminal references.
  for (let index = rawMessages.length - 1; index >= 0; index -= 1) {
    const message = rawMessages[index];
    if (String(message?.role ?? "").toLowerCase() !== "tool") continue;
    const ref = historicalDraftRef(historicalToolEnvelope(message));
    if (ref && refs.size < HISTORY_MAX_DRAFT_REFS) refs.set(ref.draftId, ref);
  }

  const pending = new Map();
  await Promise.all(
    [...refs.values()].map(async (ref) => {
      try {
        const details = await getDraftDetails(ref.draftId, { signal });
        if (String(details?.status ?? "").toUpperCase() !== "DRAFT") return;
        const type = String(details?.type ?? ref.type).toUpperCase();
        if (type !== "LEAD") return;
        const payload =
          details?.payload && typeof details.payload === "object" && !Array.isArray(details.payload)
            ? details.payload
            : {};
        pending.set(ref.draftId, {
          draftId: ref.draftId,
          type,
          payload,
          status: "pending",
          expiresAt: details?.expiresAt,
        });
      } catch (error) {
        if (signal.aborted) throw error;
        // A missing draft is safely non-actionable. Transient failures must fail history hydration
        // instead of silently hiding a still-valid Confirm/Cancel card behind an apparently
        // complete transcript; the user can then Retry history or explicitly Start fresh.
        if (error?.status === 404) return;
        throw error;
      }
    })
  );
  return pending;
}

function hydrateHistoryMessages(rawMessages, pendingDrafts = new Map()) {
  const messages = [];
  let pendingResultSets = [];
  let pendingDraft = null;
  let pendingSourceId;

  const flushOrphanedResults = () => {
    if (pendingResultSets.length === 0 && !pendingDraft) return;
    messages.push({
      id: `history-results-${pendingSourceId ?? nextId()}`,
      role: "assistant",
      text: "",
      toolEvents: [],
      resultSets: pendingResultSets,
      ...(pendingDraft ? { draft: pendingDraft } : {}),
      streaming: false,
    });
    pendingResultSets = [];
    pendingDraft = null;
    pendingSourceId = undefined;
  };

  for (const rawMessage of rawMessages) {
    const role = String(rawMessage?.role ?? "").toLowerCase();
    if (role === "tool") {
      const envelope = historicalToolEnvelope(rawMessage);
      const resultSet = historicalToolResult(envelope);
      if (resultSet) {
        pendingResultSets.push(resultSet);
        pendingSourceId = rawMessage.id ?? pendingSourceId;
      }
      const draftRef = historicalDraftRef(envelope);
      const resolvedDraft = draftRef ? pendingDrafts.get(draftRef.draftId) : null;
      if (resolvedDraft) {
        pendingDraft = resolvedDraft;
        pendingSourceId = rawMessage.id ?? pendingSourceId;
      }
      continue;
    }
    if (role === "user") flushOrphanedResults();
    const message = historyMessage(rawMessage);
    if (!message) continue;
    if (role === "assistant" && (pendingResultSets.length > 0 || pendingDraft)) {
      if (pendingResultSets.length > 0) {
        message.resultSets = [...pendingResultSets, ...message.resultSets];
      }
      if (pendingDraft) message.draft = pendingDraft;
      pendingResultSets = [];
      pendingDraft = null;
      pendingSourceId = undefined;
    }
    messages.push(message);
  }
  flushOrphanedResults();
  return messages;
}

async function loadHistory(conversationId, signal) {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, HISTORY_LOAD_TIMEOUT_MS);
  const rawMessages = [];
  let page = 1;
  let totalPages;
  let firstPage = true;

  try {
    do {
      const response = await getConversationMessages(conversationId, {
        page,
        per_page: HISTORY_PAGE_SIZE,
        signal: controller.signal,
      });
      const items = Array.isArray(response) ? response : response?.items ?? [];
      const rawTotalPages = Number(response?.meta?.total_pages);
      const reportedTotalPages =
        Number.isSafeInteger(rawTotalPages) && rawTotalPages >= 1 ? rawTotalPages : 1;
      totalPages = reportedTotalPages;

      if (firstPage && reportedTotalPages > HISTORY_MAX_PAGES) {
        // The API is oldest-first. Page one is useful to learn the total, but when the history is
        // capped we discard it and jump to the newest bounded page window.
        rawMessages.length = 0;
        page = reportedTotalPages - HISTORY_MAX_PAGES + 1;
      } else {
        const remaining = HISTORY_MAX_MESSAGES - rawMessages.length;
        if (remaining > 0) rawMessages.push(...items.slice(0, remaining));
        page += 1;
      }
      firstPage = false;
    } while (page <= totalPages);

    const pendingDrafts = await loadPendingHistoricalDrafts(rawMessages, controller.signal);
    return hydrateHistoryMessages(rawMessages, pendingDrafts);
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error("Conversation history timed out");
      timeoutError.code = "history_timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function useAiChat({ accountKey, onUnauthenticated } = {}) {
  const normalizedAccountKey = normalizeAccountKey(accountKey);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeAccountKey, activateAccountKey] = useReducer(replaceValue, normalizedAccountKey);
  const [activeConversationId, setActiveConversationId] = useReducer(replaceValue, undefined);
  const renderedAccountKeyRef = useRef(normalizedAccountKey);
  const conversationIdRef = useRef(undefined);
  const operationAbortRef = useRef(null);
  const sessionEpochRef = useRef(0);
  const hydrationPromiseRef = useRef(Promise.resolve());
  const historyBlockedRef = useRef(false);
  const sendLockRef = useRef(null);
  const intentActionLocksRef = useRef(new Set());

  useEffect(
    () => onAiUnauthenticated(onUnauthenticated),
    [onUnauthenticated]
  );

  const hydrateConversation = useCallback(
    (conversationId, capturedAccountKey, epoch, controller) => {
      historyBlockedRef.current = false;
      dispatch({ type: "HYDRATE_START" });
      const hydration = loadHistory(conversationId, controller.signal)
        .then((messages) => {
          if (
            sessionEpochRef.current === epoch &&
            renderedAccountKeyRef.current === capturedAccountKey &&
            !controller.signal.aborted
          ) {
            historyBlockedRef.current = false;
            dispatch({ type: "HYDRATE_SUCCESS", messages });
          }
        })
        .catch((error) => {
          if (
            sessionEpochRef.current !== epoch ||
            renderedAccountKeyRef.current !== capturedAccountKey ||
            isCancelled(error)
          ) {
            return;
          }
          if (error?.status === 404) {
            if (conversationIdRef.current === conversationId) {
              conversationIdRef.current = undefined;
              setActiveConversationId(undefined);
            }
            removeStoredConversationId(capturedAccountKey, conversationId);
            historyBlockedRef.current = false;
            dispatch({ type: "HYDRATE_SUCCESS", messages: [] });
          } else {
            // Keep the pointer so the user can retry the same history. Sending remains blocked
            // until hydration succeeds or the user explicitly chooses Start fresh.
            historyBlockedRef.current = true;
            dispatch({ type: "HYDRATE_FAILURE", message: error?.message });
          }
        })
        .finally(() => {
          if (operationAbortRef.current === controller) operationAbortRef.current = null;
        });
      hydrationPromiseRef.current = hydration;
      return hydration;
    },
    []
  );

  useLayoutEffect(() => {
    renderedAccountKeyRef.current = normalizedAccountKey;
    activateAccountKey(normalizedAccountKey);
    const epoch = sessionEpochRef.current + 1;
    sessionEpochRef.current = epoch;
    operationAbortRef.current?.abort();
    sendLockRef.current = null;
    intentActionLocksRef.current.clear();

    const controller = new AbortController();
    operationAbortRef.current = controller;
    const storedConversationId = readStoredConversationId(normalizedAccountKey);
    conversationIdRef.current = storedConversationId;
    setActiveConversationId(storedConversationId);
    historyBlockedRef.current = false;
    dispatch({ type: "RESET" });

    if (!storedConversationId) {
      hydrationPromiseRef.current = Promise.resolve();
    } else {
      hydrateConversation(storedConversationId, normalizedAccountKey, epoch, controller);
    }

    return () => {
      if (sessionEpochRef.current === epoch) sessionEpochRef.current += 1;
      controller.abort();
      if (operationAbortRef.current === controller) operationAbortRef.current = null;
    };
  }, [hydrateConversation, normalizedAccountKey]);

  const isCurrentSession = useCallback(
    (epoch, capturedAccountKey) =>
      sessionEpochRef.current === epoch &&
      renderedAccountKeyRef.current === capturedAccountKey,
    []
  );

  const ensureConversation = useCallback(
    async (epoch, capturedAccountKey, signal) => {
      if (conversationIdRef.current) return conversationIdRef.current;
      const conversation = await createConversation(undefined, { signal });
      if (!isCurrentSession(epoch, capturedAccountKey) || signal.aborted) {
        throw new AiStreamError("cancelled", "Account changed");
      }
      if (!conversation?.id) throw new AiStreamError("network", "Conversation id is missing");
      conversationIdRef.current = conversation.id;
      setActiveConversationId(conversation.id);
      storeConversationId(capturedAccountKey, conversation.id);
      return conversation.id;
    },
    [isCurrentSession]
  );

  const send = useCallback(
    async (text) => {
      const trimmed = (text ?? "").trim();
      if (!trimmed || !normalizedAccountKey || sendLockRef.current) return false;

      const lock = Symbol("ai-send");
      sendLockRef.current = lock;
      const epoch = sessionEpochRef.current;
      const capturedAccountKey = renderedAccountKeyRef.current;
      let assistantId;
      let controller;

      try {
        await hydrationPromiseRef.current;
        if (!isCurrentSession(epoch, capturedAccountKey) || historyBlockedRef.current) return false;

        const userId = nextId();
        assistantId = nextId();
        dispatch({
          type: "SEND",
          userId,
          assistantId,
          text: trimmed,
          createdAt: new Date().toISOString(),
        });

        controller = new AbortController();
        operationAbortRef.current = controller;
        let conversationId = await ensureConversation(
          epoch,
          capturedAccountKey,
          controller.signal
        );

        const onEvent = ({ event, data }) => {
          if (
            !isCurrentSession(epoch, capturedAccountKey) ||
            controller.signal.aborted
          ) {
            return;
          }
          switch (event) {
            case "token":
              dispatch({ type: "TOKEN", assistantId, text: data?.text ?? "" });
              break;
            case "tool_start":
              dispatch({
                type: "TOOL_START",
                assistantId,
                tool: data?.tool,
                summary: data?.summary,
              });
              break;
            case "tool_end":
              dispatch({
                type: "TOOL_END",
                assistantId,
                tool: data?.tool,
                status: data?.status,
              });
              break;
            case "draft":
              dispatch({
                type: "DRAFT",
                assistantId,
                draftId: data?.draftId,
                draftType: data?.type,
                payload: data?.payload,
              });
              break;
            case "result_set":
              dispatch({
                type: "RESULT_SET",
                assistantId,
                resultSet: normalizeResultSet(data),
              });
              break;
            case "usage":
              dispatch({ type: "USAGE", usage: data });
              break;
            case "done":
              dispatch({
                type: "DONE",
                assistantId,
                createdAt: new Date().toISOString(),
              });
              break;
            case "error":
              dispatch({
                type: "STREAM_ERROR_EVENT",
                assistantId,
                error: { code: data?.code, message: data?.message },
              });
              break;
            default:
              break;
          }
        };

        const stream = () =>
          streamAiMessage({
            conversationId,
            content: trimmed,
            signal: controller.signal,
            onEvent,
          });

        try {
          await stream();
        } catch (error) {
          if (
            error instanceof AiStreamError &&
            error.code === "conversation_not_found" &&
            isCurrentSession(epoch, capturedAccountKey) &&
            !controller.signal.aborted
          ) {
            if (conversationIdRef.current === conversationId) {
              conversationIdRef.current = undefined;
              setActiveConversationId(undefined);
            }
            removeStoredConversationId(capturedAccountKey, conversationId);
            conversationId = await ensureConversation(
              epoch,
              capturedAccountKey,
              controller.signal
            );
            await stream();
          } else {
            throw error;
          }
        }
        return true;
      } catch (error) {
        if (!isCurrentSession(epoch, capturedAccountKey) || isCancelled(error)) return false;
        const streamCode = error instanceof AiStreamError ? error.code : "network";
        const code = streamCode === "conversation_not_found" ? "network" : streamCode;
        dispatch({
          type: "FAILURE",
          assistantId,
          error: { code, message: error.message },
        });
        return false;
      } finally {
        if (sendLockRef.current === lock) sendLockRef.current = null;
        if (controller && operationAbortRef.current === controller) {
          operationAbortRef.current = null;
        }
      }
    },
    [ensureConversation, isCurrentSession, normalizedAccountKey]
  );

  const confirmDraft = useCallback(async (messageId, draftId, overrides) => {
    const epoch = sessionEpochRef.current;
    const capturedAccountKey = renderedAccountKeyRef.current;
    if (!capturedAccountKey) return false;
    dispatch({ type: "DRAFT_ACTION_START", assistantId: messageId });
    try {
      const result = await confirmDraftRequest(draftId, overrides);
      if (isCurrentSession(epoch, capturedAccountKey)) {
        dispatch({
          type: "DRAFT_CONFIRMED",
          assistantId: messageId,
          leadId: result?.leadId ?? null,
        });
      }
      return true;
    } catch (error) {
      if (isCurrentSession(epoch, capturedAccountKey)) {
        dispatch({ type: "DRAFT_ACTION_ERROR", assistantId: messageId, error: error.message });
      }
      return false;
    }
  }, [isCurrentSession]);

  const cancelDraft = useCallback(async (messageId, draftId) => {
    const epoch = sessionEpochRef.current;
    const capturedAccountKey = renderedAccountKeyRef.current;
    if (!capturedAccountKey) return false;
    dispatch({ type: "DRAFT_ACTION_START", assistantId: messageId });
    try {
      await cancelDraftRequest(draftId);
      if (isCurrentSession(epoch, capturedAccountKey)) {
        dispatch({ type: "DRAFT_CANCELLED", assistantId: messageId });
      }
      return true;
    } catch (error) {
      if (isCurrentSession(epoch, capturedAccountKey)) {
        dispatch({ type: "DRAFT_ACTION_ERROR", assistantId: messageId, error: error.message });
      }
      return false;
    }
  }, [isCurrentSession]);

  const runIntentAction = useCallback(
    async (action, messageId, resultSetIndex, intentId) => {
      const actionKey = `${action}:${intentId}`;
      const capturedAccountKey = renderedAccountKeyRef.current;
      if (!capturedAccountKey || !intentId || intentActionLocksRef.current.has(actionKey)) {
        return false;
      }
      intentActionLocksRef.current.add(actionKey);
      const epoch = sessionEpochRef.current;
      dispatch({
        type: "RESULT_ACTION_START",
        assistantId: messageId,
        resultSetIndex,
        intentId,
      });
      try {
        const result =
          action === "publish"
            ? await publishBuyingIntentRequest(intentId)
            : await closeBuyingIntentRequest(intentId);
        if (isCurrentSession(epoch, capturedAccountKey)) {
          dispatch({
            type: "RESULT_ACTION_SUCCESS",
            assistantId: messageId,
            resultSetIndex,
            intentId,
            result,
          });
        }
        return true;
      } catch (error) {
        if (isCurrentSession(epoch, capturedAccountKey)) {
          dispatch({
            type: "RESULT_ACTION_ERROR",
            assistantId: messageId,
            resultSetIndex,
            intentId,
            error: error.message,
          });
        }
        return false;
      } finally {
        intentActionLocksRef.current.delete(actionKey);
      }
    },
    [isCurrentSession]
  );

  const retryLast = useCallback(() => {
    const text = state.lastText;
    dispatch({ type: "CLEAR_ERROR" });
    if (text) return send(text);
    return false;
  }, [state.lastText, send]);

  const retryHistory = useCallback(() => {
    const capturedAccountKey = renderedAccountKeyRef.current;
    const conversationId = conversationIdRef.current;
    if (!capturedAccountKey || !conversationId) return false;

    operationAbortRef.current?.abort();
    const controller = new AbortController();
    operationAbortRef.current = controller;
    return hydrateConversation(
      conversationId,
      capturedAccountKey,
      sessionEpochRef.current,
      controller
    );
  }, [hydrateConversation]);

  const selectConversation = useCallback((conversationId) => {
    const capturedAccountKey = renderedAccountKeyRef.current;
    const normalizedConversationId = String(conversationId ?? "").trim();
    if (!capturedAccountKey || !normalizedConversationId) return false;
    if (
      conversationIdRef.current === normalizedConversationId &&
      !historyBlockedRef.current
    ) {
      return true;
    }

    const epoch = sessionEpochRef.current + 1;
    sessionEpochRef.current = epoch;
    operationAbortRef.current?.abort();
    sendLockRef.current = null;
    intentActionLocksRef.current.clear();
    historyBlockedRef.current = false;

    const controller = new AbortController();
    operationAbortRef.current = controller;
    conversationIdRef.current = normalizedConversationId;
    setActiveConversationId(normalizedConversationId);
    storeConversationId(capturedAccountKey, normalizedConversationId);
    dispatch({ type: "RESET" });
    return hydrateConversation(
      normalizedConversationId,
      capturedAccountKey,
      epoch,
      controller
    );
  }, [hydrateConversation]);

  const resetConversation = useCallback(() => {
    sessionEpochRef.current += 1;
    operationAbortRef.current?.abort();
    operationAbortRef.current = null;
    sendLockRef.current = null;
    intentActionLocksRef.current.clear();
    hydrationPromiseRef.current = Promise.resolve();
    historyBlockedRef.current = false;
    const conversationId = conversationIdRef.current;
    conversationIdRef.current = undefined;
    setActiveConversationId(undefined);
    removeStoredConversationId(renderedAccountKeyRef.current, conversationId);
    dispatch({ type: "RESET" });
  }, []);

  // useLayoutEffect switches the underlying session before paint. This render-time mask is an
  // additional guarantee that React can never expose account A's messages during the render that
  // receives account B's key.
  const accountMatches = activeAccountKey === normalizedAccountKey;
  const visibleState = accountMatches ? state : initialState;

  return {
    status: visibleState.status,
    messages: visibleState.messages,
    error: visibleState.error,
    usage: visibleState.usage,
    accountReady: accountMatches && normalizedAccountKey !== null,
    activeConversationId: accountMatches ? activeConversationId : undefined,
    send,
    retryLast,
    retryHistory,
    startFreshConversation: resetConversation,
    resetConversation,
    selectConversation,
    confirmDraft,
    cancelDraft,
    publishBuyingIntent: (messageId, resultSetIndex, intentId) =>
      runIntentAction("publish", messageId, resultSetIndex, intentId),
    closeBuyingIntent: (messageId, resultSetIndex, intentId) =>
      runIntentAction("close", messageId, resultSetIndex, intentId),
  };
}
