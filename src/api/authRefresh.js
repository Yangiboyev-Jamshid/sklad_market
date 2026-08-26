import axios from "axios";

export const AUTH_REFRESH_TIMEOUT_MS = 15_000;
export const AUTH_REFRESH_LOCK_NAME = "skladx-auth-refresh";
export const AUTH_REFRESH_STALE_SESSION = "AUTH_REFRESH_STALE_SESSION";

let refreshPromise = null;

function storageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function normalizedLanguage(value) {
  const language = String(value ?? "").trim().toUpperCase();
  return language || "RU";
}

function normalizedRole(value) {
  const role = String(value ?? "").trim().toUpperCase();
  return role.startsWith("ROLE_") ? role.slice(5) : role;
}

function jwtPayload(token) {
  if (typeof token !== "string") return null;
  const encoded = token.split(".")[1];
  if (!encoded) return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function tokenSubject(token) {
  const subject = jwtPayload(token)?.sub;
  return typeof subject === "string" && subject ? subject : null;
}

function cachedIdentity() {
  try {
    const user = JSON.parse(storageValue("skladx_user") || "null");
    const identity = user?.username
      ? `username:${user.username}`
      : user?.id != null
        ? `id:${user.id}`
        : null;
    if (!identity) return null;
    const role = normalizedRole(user?.role);
    return role ? `${identity}|role:${role}` : identity;
  } catch {
    return null;
  }
}

function staleSessionError() {
  const error = new Error("Authentication session changed while refreshing");
  error.name = "AuthRefreshStaleSessionError";
  error.code = AUTH_REFRESH_STALE_SESSION;
  return error;
}

export function isAuthRefreshStaleSessionError(error) {
  return error?.code === AUTH_REFRESH_STALE_SESSION;
}

function captureSession(refreshToken) {
  const accessToken = storageValue("access_token");
  return {
    refreshToken,
    accessToken,
    subject: tokenSubject(accessToken) ?? tokenSubject(refreshToken),
    identity: cachedIdentity(),
  };
}

function isSameSession(snapshot, refreshToken, accessToken) {
  const currentSubject = tokenSubject(accessToken) ?? tokenSubject(refreshToken);
  if (snapshot.subject && currentSubject && snapshot.subject !== currentSubject) return false;

  const currentIdentity = cachedIdentity();
  if (snapshot.identity && currentIdentity && snapshot.identity !== currentIdentity) return false;
  if (snapshot.identity && !currentIdentity) return false;
  return true;
}

// A second tab (or another authenticated client) may have completed a refresh while this request
// was waiting. Reuse its access token only when the refresh token changed and the cached/JWT
// identity still belongs to the same session. Never let an old response overwrite a newer login.
function recoverRefreshWinner(snapshot) {
  const currentRefreshToken = storageValue("refresh_token");
  if (currentRefreshToken === snapshot.refreshToken) return null;

  const currentAccessToken = storageValue("access_token");
  if (
    !currentRefreshToken ||
    !currentAccessToken ||
    !isSameSession(snapshot, currentRefreshToken, currentAccessToken)
  ) {
    throw staleSessionError();
  }

  return {
    accessToken: currentAccessToken,
    refreshToken: currentRefreshToken,
    data: { accessToken: currentAccessToken, refreshToken: currentRefreshToken },
    recovered: true,
  };
}

function assertSessionStillCurrent(snapshot) {
  const winner = recoverRefreshWinner(snapshot);
  if (winner) return winner;

  const currentAccessToken = storageValue("access_token");
  if (!isSameSession(snapshot, snapshot.refreshToken, currentAccessToken)) {
    throw staleSessionError();
  }
  return null;
}

async function performRefresh(snapshot, acceptLanguage) {
  const winnerBeforeRequest = assertSessionStillCurrent(snapshot);
  if (winnerBeforeRequest) return winnerBeforeRequest;

  let response;
  try {
    response = await axios.post(
      "/api/v1/auth/refresh",
      { refreshToken: snapshot.refreshToken },
      {
        timeout: AUTH_REFRESH_TIMEOUT_MS,
        headers: { "Accept-Language": normalizedLanguage(acceptLanguage) },
      }
    );

    if (response.data?.success === false) {
      throw new Error(response.data.message || "Refresh failed");
    }
  } catch (error) {
    const winnerAfterFailure = recoverRefreshWinner(snapshot);
    if (winnerAfterFailure) return winnerAfterFailure;
    throw error;
  }

  // The response may be older than a refresh/login that completed while the POST was in flight.
  const winnerAfterRequest = assertSessionStillCurrent(snapshot);
  if (winnerAfterRequest) return winnerAfterRequest;

  const data = response.data?.data ?? response.data ?? {};
  const accessToken = data.access_token ?? data.accessToken;
  const nextRefreshToken = data.refresh_token ?? data.refreshToken;
  if (!accessToken) throw new Error("Refresh response missing access token");

  localStorage.setItem("access_token", accessToken);
  if (nextRefreshToken) localStorage.setItem("refresh_token", nextRefreshToken);
  return { accessToken, refreshToken: nextRefreshToken ?? snapshot.refreshToken, data };
}

async function performRefreshWithCrossTabLock(snapshot, acceptLanguage) {
  const locks = typeof navigator !== "undefined" ? navigator.locks : null;
  if (typeof locks?.request === "function") {
    return locks.request(AUTH_REFRESH_LOCK_NAME, () => performRefresh(snapshot, acceptLanguage));
  }
  return performRefresh(snapshot, acceptLanguage);
}

/**
 * The only frontend path allowed to rotate refresh tokens. Ordinary Axios requests, standalone
 * callers, and the AI SSE/JSON clients all join this module-level promise. Where supported, a
 * Web Lock also serializes refreshes across tabs; the token is re-read after acquiring that lock.
 */
export function refreshAccessTokenSingleflight({ acceptLanguage } = {}) {
  if (refreshPromise) return refreshPromise;

  const refreshToken = storageValue("refresh_token");
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));
  const snapshot = captureSession(refreshToken);

  refreshPromise = performRefreshWithCrossTabLock(snapshot, acceptLanguage).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
