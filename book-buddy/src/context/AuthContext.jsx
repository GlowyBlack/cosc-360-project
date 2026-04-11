import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import { createAppSocket } from "../config/socket.js";
import API, { authHeader, flashSessionExpired } from "../config/api.js";

const STORAGE_KEY = "bookbuddy:user";

const socket = createAppSocket();

function tokenPresentInStorage() {
  const raw = String(localStorage.getItem("token") ?? "");
  const unquoted = raw.replace(/^"|"$/g, "");
  const token = unquoted.startsWith("Bearer ")
    ? unquoted.slice("Bearer ".length)
    : unquoted;
  return Boolean(String(token).trim());
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSessionUser = useCallback((sessionUser) => {
    if (!sessionUser) return;
    setUser(sessionUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setHasUnreadMessages(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("token");
  }, []);

  const clearMessageUnread = useCallback(() => {
    setHasUnreadMessages(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userId = String(user._id ?? user.id ?? "");
    if (!userId) return;
    socket.emit("join_user_room", userId);
    socket.on("force_logout", () => {
      flashSessionExpired();
      logout();
    });
    socket.on("new_message_notification", () => {
      if (window.location.pathname !== "/messages") {
        setHasUnreadMessages(true);
      }
    });
    return () => {
      socket.off("force_logout");
      socket.off("new_message_notification");
    };
  }, [user, logout]);

  useEffect(() => {
    let cancelled = false;
    const storedUser = readStoredUser();

    if (!tokenPresentInStorage()) {
      if (storedUser) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      return undefined;
    }

    (async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: { ...authHeader() },
        });
        if (cancelled) return;
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        if (!data || cancelled) return;
        setUser(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, logout]);

  const value = useMemo(
    () => ({ user, setSessionUser, logout, hasUnreadMessages, clearMessageUnread }),
    [user, setSessionUser, logout, hasUnreadMessages, clearMessageUnread],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}