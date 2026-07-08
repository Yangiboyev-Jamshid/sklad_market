// Real backend HTTP client (skladmarket.uz, proxied under /api — see vite.config.js).
// Every endpoint responds with the same envelope: { success, data, message }.
import axios from "axios";

const http = axios.create({ baseURL: "/api/v1" });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

async function refreshTokens() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("No refresh token");
  const res = await axios.post("/api/v1/auth/refresh", { refreshToken });
  const data = res.data?.data ?? {};
  const accessToken = data.access_token ?? data.accessToken;
  const nextRefreshToken = data.refresh_token ?? data.refreshToken;
  if (!accessToken) throw new Error("Refresh response missing access token");
  localStorage.setItem("access_token", accessToken);
  if (nextRefreshToken) localStorage.setItem("refresh_token", nextRefreshToken);
  return accessToken;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes("/auth/");

    if (response?.status === 401 && config && !config._retry && !isAuthEndpoint && localStorage.getItem("refresh_token")) {
      config._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshTokens();
        const token = await refreshPromise;
        refreshPromise = null;
        config.headers.Authorization = `Bearer ${token}`;
        return http(config);
      } catch {
        refreshPromise = null;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    const isAccessDenied = response?.status === 403 || response?.data === "Access Denied";

    const message =
      response?.data?.message ||
      (Array.isArray(response?.data?.errors) ? response.data.errors.join(", ") : null) ||
      (isAccessDenied ? "Недостаточно прав для выполнения этого действия" : null) ||
      (typeof response?.data === "string" && response.data) ||
      error.message ||
      "Ошибка сети";
    return Promise.reject(new Error(message));
  }
);

// Unwraps the { success, data, message } envelope and returns just `data`.
export async function unwrap(promise) {
  const res = await promise;
  if (res.data?.success === false) throw new Error(res.data.message || "Ошибка запроса");
  return res.data?.data;
}

export default http;
