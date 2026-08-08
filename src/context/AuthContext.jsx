import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { logout as apiLogout, getAccessToken, getMyUserContext } from "../api/api";
import { connectChatSocket, disconnectChatSocket } from "../api/chatSocket";
import { disconnectSupportChatSocket } from "../api/supportChatSocket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("access_token");
      const stored = localStorage.getItem("skladx_user");
      if (token && stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const login = (data = {}) => {
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
    refreshUser();
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem("skladx_user");
    setUser(null);
    disconnectChatSocket();
    disconnectSupportChatSocket();
  };

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const ctx = await getMyUserContext();
      setUser((prev) => {
        const fullName = [ctx.firstName, ctx.lastName].filter(Boolean).join(" ");
        const next = {
          ...prev,
          id: ctx.id ?? prev?.id ?? null,
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
    } catch {}
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token && user) {
      setUser(null);
      localStorage.removeItem("skladx_user");
    } else if (token) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    const roleUpper = (user?.role || "").toUpperCase();
    const isModerator = roleUpper.includes("MODERATOR") || roleUpper.includes("ADMIN");
    if (user && !isModerator) connectChatSocket();
    else disconnectChatSocket();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

