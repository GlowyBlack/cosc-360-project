import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API, { authHeader } from "../config/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminUserSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/admin/users/search?q=${encodeURIComponent(trimmed)}`,
          { headers: { ...authHeader() } }
        );
        const data = await res.json().catch(() => []);
        setResults(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!user || user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  const showEmpty =
    query.trim().length > 0 && !loading && results.length === 0;

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Admin — User search</h1>
      <label htmlFor="admin-user-search-q" style={{ display: "block", marginBottom: "0.5rem" }}>
        Search users
      </label>
      <input
        id="admin-user-search-q"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Username, email, or book title/author…"
        autoComplete="off"
        style={{
          width: "100%",
          padding: "0.6rem 0.75rem",
          fontSize: "1rem",
          marginBottom: "1.25rem",
        }}
      />

      {loading ? (
        <p style={{ color: "#666" }}>Searching…</p>
      ) : showEmpty ? (
        <p style={{ color: "#666" }}>No results</p>
      ) : query.trim().length === 0 ? (
        <p style={{ color: "#666" }}>Type a query to search.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {results.map((row) => (
            <li
              key={String(row._id)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "1rem",
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 700 }}>{row.username}</div>
              <div style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {row.email}
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Role: <strong>{row.role}</strong>
                {" · "}
                Books listed: <strong>{row.bookCount}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#555" }}>
                {row.isSuspended ? "Suspended · " : ""}
                {row.isBanned ? "Banned" : ""}
                {!row.isSuspended && !row.isBanned ? "Active" : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
