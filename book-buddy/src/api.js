const TOKEN_KEY = "access_token";

export const API_BASE_URL = "http://localhost:5001";

export function authHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default {
  API_BASE_URL,
  authHeader,
};
