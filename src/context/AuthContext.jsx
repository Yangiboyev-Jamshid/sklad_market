import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout, getAccessToken } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Восстанавливаем сессию из localStorage при загрузке
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("access_token");
      const stored = localStorage.getItem("skladx_user");
      if (token && stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  /**
   * login принимает либо объект ответа от API, либо { accountType }
   * @param {Object} data — данные от сервера или mock
   */
  const login = (data = {}) => {
    // data is the unwrapped payload from /auth/registration/login:
    // { firstName, lastName, username, role, accessToken, refreshToken, expiresIn }
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
    const userData = {
      name: fullName || data.username || "Пользователь",
      role: data.role || "user",
      username: data.username || "",
      accountType: (data.role || "buyer").toLowerCase(),
      id: data.id || null,
      raw: data,
    };

    setUser(userData);
    localStorage.setItem("skladx_user", JSON.stringify(userData));
  };

  const logout = () => {
    apiLogout(); // очищает токены из localStorage
    localStorage.removeItem("skladx_user");
    setUser(null);
  };

  // Синхронизация: если токен удалён извне — сбрасываем юзера
  useEffect(() => {
    const token = getAccessToken();
    if (!token && user) {
      setUser(null);
      localStorage.removeItem("skladx_user");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

