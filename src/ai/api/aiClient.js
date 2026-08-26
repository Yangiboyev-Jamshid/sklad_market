// Client for ai-service's /api/v1/ai/** surface. JSON calls use the AI-owned axios instance;
// the streaming turn is a raw fetch + ReadableStream because EventSource cannot POST or set an
// Authorization header.
import { getAiLocale, aiLocaleToAcceptLanguage } from "../i18n";
import aiHttp, {
  AI_GENERATION_TIMEOUT_MS,
  AI_UPLOAD_TIMEOUT_MS,
  isAuthRefreshStaleSessionError,
  notifyAiUnauthenticated,
  refreshAiAccessToken,
  unwrapAi,
} from "./aiHttp";
import { createSseParser } from "./sse";

// This is an inactivity timeout. It is reset whenever the connection opens or a stream chunk
// arrives, so a healthy long-running multi-tool turn is not cut off.
export const STREAM_READ_TIMEOUT_MS = 120_000;

export class AiStreamError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = "AiStreamError";
    this.code = code;
  }
}

function acceptLanguageHeader() {
  return { "Accept-Language": aiLocaleToAcceptLanguage(getAiLocale()) };
}

export async function createConversation(title, { signal } = {}) {
  return unwrapAi(aiHttp.post("/ai/conversations", title ? { title } : {}, { signal }));
}

export async function listConversations({ page = 1, per_page = 20, signal } = {}) {
  return unwrapAi(aiHttp.get("/ai/conversations", { params: { page, per_page }, signal }));
}

export async function getConversationMessages(
  conversationId,
  { page = 1, per_page = 20, signal } = {}
) {
  return unwrapAi(
    aiHttp.get(`/ai/conversations/${conversationId}/messages`, {
      params: { page, per_page },
      signal,
    })
  );
}

export async function deleteConversation(conversationId, { signal } = {}) {
  return unwrapAi(aiHttp.delete(`/ai/conversations/${conversationId}`, { signal }));
}

export async function listAiRateLimits({ signal } = {}) {
  return unwrapAi(aiHttp.get("/ai/admin/rate-limits", { signal }));
}

export async function updateAiRateLimit(
  userSub,
  { requestsPerMinute, dailyTokenBudget },
  { signal } = {}
) {
  return unwrapAi(
    aiHttp.put(
      `/ai/admin/rate-limits/${encodeURIComponent(userSub)}`,
      { requestsPerMinute, dailyTokenBudget },
      { signal }
    )
  );
}

export async function resetAiRateLimit(userSub, { signal } = {}) {
  return unwrapAi(
    aiHttp.delete(`/ai/admin/rate-limits/${encodeURIComponent(userSub)}`, { signal })
  );
}

export async function listAiRoleQuotas({ signal } = {}) {
  return unwrapAi(aiHttp.get("/ai/admin/role-quotas", { signal }));
}

export async function updateAiRoleQuota(
  roleName,
  { hourlyRequestLimit, dailyRequestLimit },
  { signal } = {}
) {
  return unwrapAi(
    aiHttp.put(
      `/ai/admin/role-quotas/${encodeURIComponent(roleName)}`,
      { hourlyRequestLimit, dailyRequestLimit },
      { signal }
    )
  );
}

export async function confirmDraft(draftId, overrides) {
  return unwrapAi(aiHttp.post(`/ai/drafts/${draftId}/confirm`, overrides ?? {}));
}

export async function cancelDraft(draftId) {
  return unwrapAi(aiHttp.post(`/ai/drafts/${draftId}/cancel`, {}));
}

export async function getDraftDetails(draftId, { signal } = {}) {
  return unwrapAi(aiHttp.get(`/ai/drafts/${encodeURIComponent(draftId)}`, { signal }));
}

export async function searchBusinesses(
  { query, types = ["PRODUCT", "COMPANY"], limit = 8 } = {},
  { signal } = {}
) {
  const normalizedTypes = Array.isArray(types) ? types.filter(Boolean).join(",") : types;
  return unwrapAi(
    aiHttp.get("/ai/business-search", {
      params: {
        q: String(query ?? "").trim().slice(0, 300),
        types: normalizedTypes || undefined,
        limit: Math.max(1, Math.min(Number(limit) || 8, 12)),
      },
      signal,
    })
  );
}

export async function getSimilarProducts(productId, { limit = 4, signal } = {}) {
  const normalizedId = Number(productId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) return { count: 0, items: [] };
  return unwrapAi(
    aiHttp.get(`/ai/similar/${normalizedId}`, {
      params: { limit: Math.max(1, Math.min(Number(limit) || 4, 12)) },
      signal,
    })
  );
}

export async function publishBuyingIntent(intentId) {
  return unwrapAi(
    aiHttp.post(`/ai/buying-intents/${encodeURIComponent(intentId)}/publish`, {
      publicationConsent: true,
    })
  );
}

export async function closeBuyingIntent(intentId) {
  return unwrapAi(
    aiHttp.post(`/ai/buying-intents/${encodeURIComponent(intentId)}/close`, {})
  );
}

export async function suggestListing({ description, imageIds }) {
  return unwrapAi(
    aiHttp.post(
      "/ai/seller/suggest-listing",
      { description, imageIds },
      { timeout: AI_GENERATION_TIMEOUT_MS }
    )
  );
}

// Upload through the platform's own attachment endpoint to obtain an attachment id. This request
// still goes through the AI-owned client so the assistant locale and auth lifecycle stay coherent.
export async function uploadListingImage(file) {
  const form = new FormData();
  form.append("file", file);
  return unwrapAi(aiHttp.post("/attach/upload", form, { timeout: AI_UPLOAD_TIMEOUT_MS }));
}

export async function deleteListingImage(imageId) {
  const normalized = String(imageId ?? "").trim();
  if (!normalized) return undefined;
  return unwrapAi(aiHttp.delete(`/attach/delete/${encodeURIComponent(normalized)}`));
}

function fetchStream(conversationId, content, signal) {
  let token;
  try {
    token = localStorage.getItem("access_token");
  } catch {
    token = null;
  }
  return fetch(`/api/v1/ai/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...acceptLanguageHeader(),
    },
    body: JSON.stringify({ content }),
    signal,
  });
}

function mergeSignals(externalSignal, timeoutSignal) {
  if (!externalSignal) return { signal: timeoutSignal, cleanup: () => {} };

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (externalSignal.aborted || timeoutSignal.aborted) controller.abort();
  externalSignal.addEventListener("abort", abort);
  timeoutSignal.addEventListener("abort", abort);

  return {
    signal: controller.signal,
    cleanup: () => {
      externalSignal.removeEventListener("abort", abort);
      timeoutSignal.removeEventListener("abort", abort);
    },
  };
}

// reader.read() is not guaranteed to reject when a mocked/polyfilled fetch signal aborts. Racing
// it against the signal makes cancellation and inactivity timeouts deterministic in every runtime.
function readNext(reader, signal, abortError) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    reader.read().then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error)
    );
  });
}

// Authentication refresh is shared by all AI requests and therefore is not aborted at the axios
// level by one stream. The caller still stops waiting immediately when its own stream is cancelled
// or reaches the inactivity deadline; the refresh request itself has a separate short timeout.
function waitForRefresh(signal, abortError) {
  if (signal.aborted) return Promise.reject(abortError());
  const promise = refreshAiAccessToken();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error)
    );
  });
}

async function httpStreamError(response) {
  const headerCode = response?.headers?.get?.("X-AI-Error-Code");
  let payload;
  try {
    payload = typeof response?.json === "function" ? await response.json() : null;
  } catch {
    payload = null;
  }
  const code = headerCode
    || (response?.status === 429 ? "rate_limited" : null)
    || (response?.status === 504 ? "timeout" : null)
    || (response?.status === 503 ? "provider_error" : null)
    || (response?.status === 400 ? "invalid_input" : null)
    || "network";
  return new AiStreamError(
    code,
    payload?.message || `Unexpected response (${response?.status ?? "unknown"})`
  );
}

// Streams one assistant turn. Authentication is refreshed at most once, 404 is kept distinct so
// the hook can replace a stale conversation, and success requires a terminal done/error event.
export async function streamAiMessage({ conversationId, content, onEvent, signal }) {
  const timeoutController = new AbortController();
  const combined = mergeSignals(signal, timeoutController.signal);
  let timeoutId;
  let timedOut = false;
  let authNotified = false;

  const armReadTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timedOut = true;
      timeoutController.abort();
    }, STREAM_READ_TIMEOUT_MS);
  };
  const abortError = () =>
    signal?.aborted
      ? new AiStreamError("cancelled", "Request cancelled")
      : new AiStreamError("timeout", "Timed out waiting for the assistant stream");
  const notifyUnauthenticated = () => {
    if (authNotified) return;
    authNotified = true;
    notifyAiUnauthenticated();
  };

  try {
    let response;
    armReadTimeout();
    try {
      response = await fetchStream(conversationId, content, combined.signal);
    } catch (error) {
      if (signal?.aborted) throw new AiStreamError("cancelled", error.message);
      if (timedOut || error.name === "AbortError") {
        throw new AiStreamError("timeout", error.message);
      }
      throw new AiStreamError("network", error.message);
    }

    if (response.status === 401) {
      try {
        await waitForRefresh(combined.signal, abortError);
      } catch (error) {
        if (error instanceof AiStreamError) throw error;
        if (isAuthRefreshStaleSessionError(error)) {
          throw new AiStreamError("cancelled", "Authentication session changed");
        }
        notifyUnauthenticated();
        throw new AiStreamError("unauthenticated", "Unauthenticated");
      }

      armReadTimeout();
      try {
        response = await fetchStream(conversationId, content, combined.signal);
      } catch (error) {
        if (signal?.aborted) throw new AiStreamError("cancelled", error.message);
        if (timedOut || error.name === "AbortError") {
          throw new AiStreamError("timeout", error.message);
        }
        throw new AiStreamError("network", error.message);
      }
      if (response.status === 401) {
        notifyUnauthenticated();
        throw new AiStreamError("unauthenticated", "Unauthenticated");
      }
    }

    if (response.status === 404) {
      throw new AiStreamError("conversation_not_found", "Conversation not found");
    }
    if (!response.ok || !response.body) {
      throw await httpStreamError(response);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let terminalEventSeen = false;
    const parser = createSseParser((event) => {
      if (event.event === "done" || event.event === "error") terminalEventSeen = true;
      onEvent?.(event);
    });

    while (true) {
      armReadTimeout();
      const { value, done } = await readNext(reader, combined.signal, abortError);
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
      if (terminalEventSeen) {
        await reader.cancel().catch(() => {});
        break;
      }
    }

    const trailing = decoder.decode();
    if (trailing) parser.push(trailing);
    parser.flush();
    if (!terminalEventSeen) {
      throw new AiStreamError("network", "Assistant stream ended before completion");
    }
  } catch (error) {
    if (error instanceof AiStreamError) throw error;
    if (signal?.aborted) throw new AiStreamError("cancelled", error.message);
    if (timedOut || error.name === "AbortError") {
      throw new AiStreamError("timeout", error.message);
    }
    throw new AiStreamError("network", error.message);
  } finally {
    clearTimeout(timeoutId);
    combined.cleanup();
  }
}
