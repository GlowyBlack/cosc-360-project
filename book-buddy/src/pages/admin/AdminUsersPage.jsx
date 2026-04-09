import { useEffect, useMemo, useState } from "react";
import API, { authHeader } from "../../config/api.js";
import "./AdminUsersPage.css";
import "./AdminDashboardPage.css";

const PAGE_SIZE = 10;
const PAGE_BUTTON_WINDOW = 10;

function bookCountMap(books) {
  const m = new Map();
  if (!Array.isArray(books)) return m;
  for (const b of books) {
    const raw = b?.bookOwner;
    const id =
      raw && typeof raw === "object" && raw._id != null
        ? String(raw._id)
        : raw != null
          ? String(raw)
          : "";
    if (!id) continue;
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [uRes, bRes] = await Promise.all([
          fetch(`${API}/admin/users`, { headers: { ...authHeader() } }),
          fetch(`${API}/admin/books`, { headers: { ...authHeader() } }),
        ]);
        if (!uRes.ok) {
          const err = await uRes.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load users");
        }
        if (!bRes.ok) {
          const err = await bRes.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to load books");
        }
        const uData = await uRes.json().catch(() => []);
        const bData = await bRes.json().catch(() => []);
        if (!cancelled) {
          setUsers(Array.isArray(uData) ? uData : []);
          setBooks(Array.isArray(bData) ? bData : []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => bookCountMap(books), [books]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const un = String(u.username ?? "").toLowerCase();
      const em = String(u.email ?? "").toLowerCase();
      return un.includes(q) || em.includes(q);
    });
  }, [users, query]);

  const totalPages = useMemo(() => {
    if (filteredUsers.length === 0) return 0;
    return Math.ceil(filteredUsers.length / PAGE_SIZE);
  }, [filteredUsers.length]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (totalPages === 0) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const { windowStart, windowEnd, showPageWindow } = useMemo(() => {
    if (totalPages === 0) {
      return { windowStart: 1, windowEnd: 1, showPageWindow: false };
    }
    if (totalPages <= PAGE_BUTTON_WINDOW) {
      return {
        windowStart: 1,
        windowEnd: totalPages,
        showPageWindow: false,
      };
    }
    const ws =
      Math.floor((page - 1) / PAGE_BUTTON_WINDOW) * PAGE_BUTTON_WINDOW + 1;
    const we = Math.min(ws + PAGE_BUTTON_WINDOW - 1, totalPages);
    return { windowStart: ws, windowEnd: we, showPageWindow: true };
  }, [totalPages, page]);

  async function runAction(userId, action) {
    const id = String(userId);
    setActingId(id);
    setActionError("");
    const paths = {
      suspend: `/admin/users/${id}/suspend`,
      unsuspend: `/admin/users/${id}/unsuspend`,
      ban: `/admin/users/${id}/ban`,
      unban: `/admin/users/${id}/unban`,
    };
    try {
      const res = await fetch(`${API}${paths[action]}`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Request failed");
      }
      const updated = await res.json().catch(() => null);
      setUsers((prev) =>
        prev.map((u) => {
          if (String(u._id) !== id) return u;
          if (updated && typeof updated === "object") {
            return {
              ...u,
              isSuspended: updated.isSuspended,
              isBanned: updated.isBanned,
            };
          }
          if (action === "suspend") return { ...u, isSuspended: true };
          if (action === "unsuspend") return { ...u, isSuspended: false };
          if (action === "ban") return { ...u, isBanned: true };
          if (action === "unban") return { ...u, isBanned: false };
          return u;
        })
      );
    } catch (e) {
      setActionError(e.message ?? "Action failed");
    } finally {
      setActingId(null);
    }
  }

  function statusLabel(u) {
    if (u.isBanned) return "Banned";
    if (u.isSuspended) return "Suspended";
    return "Active";
  }

  return (
    <div className="admin-page admin-users">
      <header className="admin-users__header">
        <div>
          <h1 className="admin-users__title">User management</h1>
          <p className="admin-users__subtitle">
            Search accounts, view roles and listing counts, and apply moderation
            actions.
          </p>
        </div>
      </header>

      {error ? (
        <p className="admin-dashboard__error" role="alert">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p className="admin-dashboard__error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="admin-users__toolbar">
        <label className="admin-users__search-label" htmlFor="admin-users-q">
          Filter directory
        </label>
        <input
          id="admin-users-q"
          type="search"
          className="admin-users__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or email…"
          autoComplete="off"
        />
        <span className="admin-users__meta">
          {loading
            ? "Loading…"
            : totalPages === 0
              ? `0 of ${users.length} users`
              : totalPages === 1
                ? `${filteredUsers.length} of ${users.length} users`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredUsers.length)} of ${filteredUsers.length} (${users.length} total)`}
        </span>
      </div>

      <div className="admin-table-wrap admin-users__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Listings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  Loading users…
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  {users.length === 0
                    ? "No users returned from the server."
                    : "No users match your filter."}
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const id = String(u._id);
                const isAdmin = u.role === "Admin";
                const busy = actingId === id;
                return (
                  <tr key={id}>
                    <td>
                      <span className="admin-users__username">
                        {u.username ?? "—"}
                      </span>
                    </td>
                    <td>{u.email ?? "—"}</td>
                    <td>{u.role ?? "—"}</td>
                    <td>
                      <span
                        className={`admin-users__status admin-users__status--${statusLabel(u).toLowerCase()}`}
                      >
                        {statusLabel(u)}
                      </span>
                    </td>
                    <td>{counts.get(id) ?? 0}</td>
                    <td>
                      {isAdmin ? (
                        <span className="admin-users__protected">Protected</span>
                      ) : (
                        <div className="admin-users__actions">
                          {!u.isSuspended ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-users__action-btn"
                              disabled={busy || u.isBanned}
                              onClick={() => runAction(u._id, "suspend")}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-users__action-btn"
                              disabled={busy || u.isBanned}
                              onClick={() => runAction(u._id, "unsuspend")}
                            >
                              Unsuspend
                            </button>
                          )}
                          {!u.isBanned ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--solid admin-users__action-btn"
                              disabled={busy}
                              onClick={() => runAction(u._id, "ban")}
                            >
                              Ban
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-users__action-btn"
                              disabled={busy}
                              onClick={() => runAction(u._id, "unban")}
                            >
                              Unban
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 ? (
        <nav
          className="admin-users__pagination"
          aria-label="User list pages"
        >
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-users__pagination-step"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="admin-users__pagination-pages">
            {showPageWindow && windowStart > 1 ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-users__pagination-chunk"
                aria-label="Show previous group of pages"
                onClick={() => setPage(windowStart - 1)}
              >
                …
              </button>
            ) : null}
            {Array.from(
              { length: Math.max(0, windowEnd - windowStart + 1) },
              (_, i) => windowStart + i
            ).map((pnum) => (
              <button
                key={pnum}
                type="button"
                className={
                  pnum === page
                    ? "admin-btn admin-btn--solid admin-users__pagination-num is-active"
                    : "admin-btn admin-btn--outline admin-users__pagination-num"
                }
                aria-current={pnum === page ? "page" : undefined}
                onClick={() => setPage(pnum)}
              >
                {pnum}
              </button>
            ))}
            {showPageWindow && windowEnd < totalPages ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-users__pagination-chunk"
                aria-label="Show next group of pages"
                onClick={() => setPage(windowEnd + 1)}
              >
                …
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-users__pagination-step"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
