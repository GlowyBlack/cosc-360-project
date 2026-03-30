const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default API;
