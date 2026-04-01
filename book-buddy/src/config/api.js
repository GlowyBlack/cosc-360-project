const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function authHeader() {
  const raw = String(localStorage.getItem("token") ?? "").trim();
  if (!raw) return {};
  const unquoted = raw.replace(/^"|"$/g, "");
  const token = unquoted.startsWith("Bearer ")
    ? unquoted.slice("Bearer ".length)
    : unquoted;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default API;
