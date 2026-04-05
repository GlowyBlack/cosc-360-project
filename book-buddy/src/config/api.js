const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function authHeader() {
  const raw = String(localStorage.getItem("token") ?? "");
  if (!raw) return {};
  const unquoted = raw.replace(/^"|"$/g, "");
  const token = unquoted.startsWith("Bearer ")
    ? unquoted.slice("Bearer ".length)
    : unquoted;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export const SESSION_EXPIRED_FLASH_KEY = "bookbuddy:sessionExpired";

export function flashSessionExpired() {
  try {
    sessionStorage.setItem(SESSION_EXPIRED_FLASH_KEY, "1");
  } catch {
  }
}

export function consumeSessionExpiredFlash() {
  try {
    if (sessionStorage.getItem(SESSION_EXPIRED_FLASH_KEY)) {
      sessionStorage.removeItem(SESSION_EXPIRED_FLASH_KEY);
      return true;
    }
  } catch {
  }
  return false;
}

export default API;
