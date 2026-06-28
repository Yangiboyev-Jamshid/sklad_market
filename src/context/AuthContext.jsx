import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout, getAccessToken } from "../data/api";

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
    // Нормализуем структуру пользователя
    const userData = {
      name: data.name || data.full_name || data.username || "Пользователь",
      role: data.role || "user",
      company: data.company || data.company_name || "",
      accountType: data.accountType || data.user_type || "buyer",
      email: data.email || "",
      phone: data.phone || "",
      id: data.id || data.user_id || null,
      // сохраняем весь raw ответ для удобства
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

