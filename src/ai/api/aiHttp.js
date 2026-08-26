import axios from "axios";
import { aiLocaleToAcceptLanguage, getAiLocale } from "../i18n";
import {
  AUTH_REFRESH_TIMEOUT_MS,
  isAuthRefreshStaleSessionError,
  refreshAccessTokenSingleflight,
} from "../../api/authRefresh";

export const AI_JSON_TIMEOUT_MS = 30_000;
export const AI_REFRESH_TIMEOUT_MS = AUTH_REFRESH_TIMEOUT_MS;
export const AI_UPLOAD_TIMEOUT_MS = 120_000;
export const AI_GENERATION_TIMEOUT_MS = 300_000;
export { isAuthRefreshStaleSessionError };

// AI requests deliberately use their own axios instance. The application's shared client
// overwrites Accept-Language with the site locale, while the assistant has an independent
// language switcher.
const aiHttp = axios.create({ baseURL: "/api/v1", timeout: AI_JSON_TIMEOUT_MS });

const unauthenticatedListeners = new Set();
let unauthenticatedNotified = false;
let unauthenticatedPending = false;
let failedAccessToken = null;

function accessToken() {
  try {
    return localStorage.getItem("access_token");
  } catch {
    return null;
  }
}

function resetUnauthenticatedState() {
  unauthenticatedNotified = false;
  unauthenticatedPending = false;
  failedAccessToken = null;
}

// A new access token represents a new authenticated session. Do not replay an authentication
// failure from the previous token into that session.
function synchronizeUnauthenticatedSession() {
  if (unauthenticatedNotified && accessToken() !== failedAccessToken) {
    resetUnauthenticatedState();
  }
}

export function notifyAiUnauthenticated() {
  synchronizeUnauthenticatedSession();
  const token = accessToken();
  if (unauthenticatedNotified) return;
  unauthenticatedNotified = true;
  failedAccessToken = token;
  unauthenticatedPending = unauthenticatedListeners.size === 0;
  unauthenticatedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Authentication cleanup must never hide the original request failure.
    }
  });
}

export function onAiUnauthenticated(listener) {
  if (typeof listener !== "function") return () => {};
  synchronizeUnauthenticatedSession();
  unauthenticatedListeners.add(listener);
  if (unauthenticatedPending) {
    unauthenticatedPending = false;
    try {
      listener();
    } catch {
      // Authentication cleanup must not break effect mounting.
    }
  }
  return () => unauthenticatedListeners.delete(listener);
}

export async function refreshAiAccessToken() {
  const { accessToken: nextAccessToken } = await refreshAccessTokenSingleflight({
    acceptLanguage: aiLocaleToAcceptLanguage(getAiLocale()),
  });
  resetUnauthenticatedState();
  return nextAccessToken;
}

aiHttp.interceptors.request.use((config) => {
  synchronizeUnauthenticatedSession();
  config.headers = config.headers ?? {};
  const token = accessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Accept-Language"] = aiLocaleToAcceptLanguage(getAiLocale());
  return config;
});

aiHttp.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && config && !config._aiRefreshAttempted) {
      config._aiRefreshAttempted = true;
      try {
        const token = await refreshAiAccessToken();
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        return aiHttp(config);
      } catch (refreshError) {
        if (!isAuthRefreshStaleSessionError(refreshError)) notifyAiUnauthenticated();
      }
    } else if (response?.status === 401) {
      notifyAiUnauthenticated();
    }

    const message =
      response?.data?.message ||
      response?.data?.errors?.reason ||
      (typeof response?.data === "string" ? response.data : null) ||
      error.message ||
      "AI request failed";
    const normalized = new Error(message);
    normalized.status = response?.status;
    normalized.code = error.code;
    normalized.aiCode = response?.headers?.["x-ai-error-code"] ?? null;
    return Promise.reject(normalized);
  }
);

export async function unwrapAi(promise) {
  const response = await promise;
  if (response.data?.success === false) {
    const error = new Error(response.data.message || "AI request failed");
    error.status = response.status;
    throw error;
  }
  return response.data?.data;
}

export default aiHttp;
