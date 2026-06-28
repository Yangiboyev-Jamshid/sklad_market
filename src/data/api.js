import axios from "axios";

const BASE_URL = "/api/v1";


function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function setTokens({ access_token, refresh_token } = {}) {
  if (access_token) localStorage.setItem("access_token", access_token);
  if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response) {
      return Promise.reject(
        new Error("Server bilan aloqa yo'q. Internet aloqangizni tekshiring.")
      );
    }

    if (response.status === 401 && !config._retry && getRefreshToken()) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(config));
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/registration/token/refresh`, {
          refresh: getRefreshToken(),
        });

        setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        onRefreshed(data.access_token);
        config.headers.Authorization = `Bearer ${data.access_token}`;
        return api(config);
      } catch (refreshError) {
        onRefreshed(null);
        clearTokens();
        return Promise.reject(buildErrorMessage(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(buildErrorMessage(error));
  }
);

function buildErrorMessage(error) {
  const { response } = error;
  const data = response?.data;

  let message;

  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    message = data.errors.join(", ");
  } else if (data && (data.message || data.detail || data.error)) {
    message = data.message || data.detail || data.error;
  } else if (response) {
    message = `Ошибка ${response.status}: ${response.statusText}`;
  } else {
    message = error.message || "Noma'lum xatolik yuz berdi";
  }

  const err = new Error(message);
  err.status = response?.status;
  err.data = data;
  return err;
}

export async function login({ username, phone, email, password }) {
  const body = {
    username: username || phone || email,
    password,
  };

  const { data } = await api.post("/auth/registration/login", body);

  setTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  return data;
}

export function logout() {
  clearTokens();
}

export { getAccessToken };

export function isAuthenticated() {
  return !!getAccessToken();
}

export default api;