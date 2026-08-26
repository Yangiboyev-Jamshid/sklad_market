import axios from "axios";
import i18n from "../i18n";
import {
  isAuthRefreshStaleSessionError,
  refreshAccessTokenSingleflight,
} from "./authRefresh";

const http = axios.create({ baseURL: "/api/v1" });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Accept-Language"] = (i18n.language || "ru").toUpperCase();
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes("/auth/");
    if (response?.status >= 500 || response?.status === 400 || response?.status === 403 || response?.status === 404) {
      console.group(`🔴 ${response.status >= 500 ? "SERVER" : "REQUEST"} ERROR ${response.status} — ${config?.method?.toUpperCase()} ${config?.url}`);
      console.log("Params:", config?.params);
      console.log("Request body:", config?.data);
      console.log("Response data:", response?.data);
      console.groupEnd();
    }

    if (response?.status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      if (localStorage.getItem("refresh_token")) {
        try {
          const { accessToken: token } = await refreshAccessTokenSingleflight({
            acceptLanguage: (i18n.language || "ru").toUpperCase(),
          });
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
          return http(config);
        } catch (refreshError) {
          // An older request must not clear a newer login/role session that won the refresh race.
          if (isAuthRefreshStaleSessionError(refreshError)) throw refreshError;
          // The existing shared-client logout path below remains authoritative.
        }
      }
      if (localStorage.getItem("access_token")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("skladx_user");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    const rejected = new Error(extractErrorMessage(error));
    rejected.status = response?.status;
    return Promise.reject(rejected);
  }
);

function extractErrorMessage(error) {
  const { response } = error;

  if (!response) {
    return error.code === "ECONNABORTED"
      ? "Сервер не отвечает. Попробуйте позже."
      : "Нет соединения с сервером. Проверьте интернет и попробуйте снова.";
  }

  const { status, data } = response;

  const isAccessDenied =
    status === 403 ||
    data === "Access Denied" ||
    data?.errors?.reason === "Access Denied" ||
    (status === 500 && data?.errors?.reason === "Access Denied");
  if (isAccessDenied) return "Доступ запрещён: у вашей роли нет прав для этого действия";

  if (typeof data?.message === "string" && data.message) return data.message;

  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join(", ");

  if (data?.errors && typeof data.errors === "object") {
    if (typeof data.errors.reason === "string") return data.errors.reason;
    const fieldMessages = Object.values(data.errors).filter((v) => typeof v === "string" && v);
    if (fieldMessages.length) return fieldMessages.join(", ");
  }

  const isHtml = typeof data === "string" && /^\s*<(!doctype|html)/i.test(data);
  if (typeof data === "string" && data && !isHtml && data !== "Access Denied") return data;

  switch (status) {
    case 400:
      return "Проверьте правильность введённых данных";
    case 401:
      return error.config?.url?.includes("/auth/registration/login")
        ? "Неверный логин или пароль"
        : "Необходимо авторизоваться";
    case 404:
      return "Запрашиваемые данные не найдены";
    case 409:
      return "Такой пользователь уже существует";
    case 413:
      return "Файл слишком большой. Выберите файл меньшего размера.";
    case 422:
      return "Введённые данные некорректны";
    default:
      return status >= 500
        ? "Ошибка сервера. Попробуйте позже"
        : error.message || "Ошибка сети";
  }
}

export async function unwrap(promise) {
  const res = await promise;
  if (res.data?.success === false) throw new Error(res.data.message || "Ошибка запроса");
  return res.data?.data;
}

export default http;
