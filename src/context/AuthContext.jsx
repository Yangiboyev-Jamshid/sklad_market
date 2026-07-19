import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { logout as apiLogout, getAccessToken, getMyUserContext } from "../api/api";

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
    // the login response doesn't carry the photo/company context — pull it
    // right away so the header avatar is correct without a full page reload
    refreshUser();
  };

  const logout = () => {
    apiLogout(); // очищает токены из localStorage
    localStorage.removeItem("skladx_user");
    setUser(null);
  };

  // Pulls firstName/lastName/photoUrl from the user service so the header
  // avatar and name reflect what was last saved on the profile page — the
  // login response alone doesn't carry a photo.
  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const ctx = await getMyUserContext();
      setUser((prev) => {
        const fullName = [ctx.firstName, ctx.lastName].filter(Boolean).join(" ");
        const next = {
          ...prev,
          name: fullName || prev?.name,
          photoUrl: ctx.photoUrl ?? null,
          firstName: ctx.firstName,
          lastName: ctx.lastName,
          username: ctx.username ?? prev?.username,
          role: ctx.role ?? prev?.role,
          companyId: ctx.companyId ?? null,
          companyName: ctx.companyName ?? null,
          companyLogoUrl: ctx.companyLogoUrl ?? null,
          sellerPanel: ctx.sellerPanel ?? false,
          moderatorPanel: ctx.moderatorPanel ?? false,
          companyProfile: ctx.companyProfile ?? false,
        };
        localStorage.setItem("skladx_user", JSON.stringify(next));
        return next;
      });
    } catch {
      // keep whatever was cached — the header just won't reflect the latest photo/name yet
    }
  }, []);

  // Синхронизация: если токен удалён извне — сбрасываем юзера
  useEffect(() => {
    const token = getAccessToken();
    if (!token && user) {
      setUser(null);
      localStorage.removeItem("skladx_user");
    } else if (token) {
      refreshUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

