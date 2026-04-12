import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MaterialIcon from "../../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader } from "../../../config/api.js";
import {
  PAGE_SIZE,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  clampText,
  reporterDisplay,
  targetLink,
  useAdminReports,
} from "../useAdminReports.js";
import "./AdminDashboardPage.css";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    actionError,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    actingId,
    page,
    setPage,
    filteredReports,
    paginatedReports,
    totalPages,
    openReportCount,
    markReviewed,
    dismissReport,
    reopenReport,
    exportCsv,
  } = useAdminReports();

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
        if (!cancelled) setError(e.message ?? "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsers = users.length;
  const totalListings = books.length;
  const activeBorrows = null;

  const investigationMeta = (() => {
    if (reportsLoading) return "Loading…";
    if (filteredReports.length === 0) return "0 reports";
    if (totalPages <= 1) {
      return `${filteredReports.length} report${filteredReports.length === 1 ? "" : "s"}`;
    }
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, filteredReports.length);
    return `Showing ${from}–${to} of ${filteredReports.length}`;
  })();

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <h1 className="admin-dashboard__title">Site Overview</h1>
          <p className="admin-dashboard__subtitle">
            Monitoring the status of BookBuddy&apos;s site.
          </p>
        </div>
        <div className="admin-dashboard__avatar" aria-hidden>
          <MaterialIcon name="person" />
        </div>
      </header>

      {error ? (
        <p className="admin-dashboard__error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="admin-dashboard__stats" aria-label="Key metrics">
        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <MaterialIcon name="menu_book" className="admin-stat-card__icon" />
            <span className="admin-stat-card__trend admin-stat-card__trend--muted">
              —
            </span>
          </div>
          <p className="admin-stat-card__label">Total listings</p>
          <p className="admin-stat-card__value">
            {loading ? "…" : totalListings.toLocaleString()}
          </p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <MaterialIcon name="group" className="admin-stat-card__icon" />
            <span className="admin-stat-card__trend admin-stat-card__trend--muted">
              —
            </span>
          </div>
          <p className="admin-stat-card__label">Total users</p>
          <p className="admin-stat-card__value">
            {loading ? "…" : totalUsers.toLocaleString()}
          </p>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <MaterialIcon name="swap_horiz" className="admin-stat-card__icon" />
            <span className="admin-stat-card__trend admin-stat-card__trend--muted">
              Stable
            </span>
          </div>
          <p className="admin-stat-card__label">Active borrows</p>
          <p className="admin-stat-card__value">
            {activeBorrows == null ? "—" : String(activeBorrows)}
          </p>
        </article>

        <article className="admin-stat-card admin-stat-card--inverted">
          <div className="admin-stat-card__top">
            <MaterialIcon
              name="flag"
              className="admin-stat-card__icon admin-stat-card__icon--on-dark"
            />
            <span className="admin-stat-card__pill">Urgent</span>
          </div>
          <p className="admin-stat-card__label admin-stat-card__label--on-dark">
            Open reports
          </p>
          <p className="admin-stat-card__value admin-stat-card__value--on-dark">
            {reportsLoading ? "…" : String(openReportCount)}
          </p>
        </article>
      </section>

      <section
        className="admin-dashboard__panel"
        aria-labelledby="pending-investigations-heading"
      >
        <div className="admin-dashboard__panel-head">
          <h2 id="pending-investigations-heading" className="admin-dashboard__panel-title">
            Pending Investigations
          </h2>
          <div className="admin-dashboard__panel-actions">
            <button
              type="button"
              className="admin-btn admin-btn--outline"
              disabled={reportsLoading || filteredReports.length === 0}
              onClick={exportCsv}
            >
              Export CSV
            </button>
            <button type="button" className="admin-btn admin-btn--solid" disabled>
              Review all
            </button>
          </div>
        </div>

        <div className="admin-dashboard__investigation-toolbar">
          <div className="admin-dashboard__investigation-search">
            <label className="admin-dashboard__investigation-label" htmlFor="admin-investigation-q">
              Search
            </label>
            <input
              id="admin-investigation-q"
              type="search"
              className="admin-dashboard__investigation-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reporter, reason, target id, type…"
              autoComplete="off"
            />
          </div>
          <div className="admin-dashboard__investigation-filters">
            <label className="admin-dashboard__investigation-label" htmlFor="admin-investigation-status">
              Status
            </label>
            <select
              id="admin-investigation-status"
              className="admin-dashboard__investigation-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by report status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="admin-dashboard__investigation-label" htmlFor="admin-investigation-type">
              Type
            </label>
            <select
              id="admin-investigation-type"
              className="admin-dashboard__investigation-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by reported entity type"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value || "all-types"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <span className="admin-dashboard__investigation-meta">{investigationMeta}</span>
        </div>

        {reportsError ? (
          <p className="admin-dashboard__error" role="alert">
            {reportsError}
          </p>
        ) : null}
        {actionError ? (
          <p className="admin-dashboard__error" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Reported entity</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportsLoading ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    Loading reports…
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    {reports.length === 0
                      ? "No reports in the queue."
                      : query.trim()
                        ? "No reports match your search."
                        : "No reports match your filters."}
                  </td>
                </tr>
              ) : (
                paginatedReports.map((r) => {
                  const id = String(r._id);
                  const busy = actingId === id;
                  const { label: repName, email: repEmail } = reporterDisplay(r);
                  const href = targetLink(r.targetType, r.targetId);
                  const tid = String(r.targetId ?? "");
                  const reasonFull = String(r.reason ?? "").trim();
                  return (
                    <tr key={id}>
                      <td>
                        <div className="admin-dashboard__cell-reporter">
                          <span>{repName}</span>
                          {repEmail ? (
                            <span className="admin-dashboard__cell-reporter-email">{repEmail}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="admin-dashboard__cell-entity">
                        <span className="admin-dashboard__cell-entity-type">{r.targetType ?? "—"}</span>
                        {href ? (
                          <Link className="admin-dashboard__cell-entity-link" to={href}>
                            Open
                          </Link>
                        ) : null}
                        <code className="admin-dashboard__cell-entity-id" title={tid}>
                          {tid.length > 10 ? `${tid.slice(0, 6)}…` : tid || "—"}
                        </code>
                      </td>
                      <td className="admin-dashboard__cell-reason" title={reasonFull || undefined}>
                        {clampText(reasonFull, 100)}
                      </td>
                      <td className="admin-dashboard__cell-date">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`admin-dashboard__status-pill admin-dashboard__status-pill--${String(r.status ?? "open").toLowerCase()}`}
                        >
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-dashboard__cell-actions">
                          {r.status === "Open" ? (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--solid admin-dashboard__action-btn"
                                disabled={busy}
                                onClick={() => markReviewed(r)}
                              >
                                {busy ? "…" : "Reviewed"}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--outline admin-dashboard__action-btn"
                                disabled={busy}
                                onClick={() => dismissReport(r)}
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-dashboard__action-btn"
                              disabled={busy}
                              onClick={() => reopenReport(r)}
                            >
                              {busy ? "…" : "Reopen"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-dashboard__table-foot">
          <span className="admin-dashboard__table-meta">{investigationMeta}</span>
          <span className="admin-dashboard__pager">
            <button
              type="button"
              disabled={reportsLoading || page <= 1 || totalPages <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {" · "}
            <button
              type="button"
              disabled={reportsLoading || page >= totalPages || totalPages <= 1}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </span>
        </div>
      </section>

      <footer className="admin-dashboard__footer">
        <p className="admin-dashboard__footer-copy">
          © {new Date().getFullYear()} BookBuddy admin. Hand-curated for readers.
        </p>
        <div className="admin-dashboard__footer-links">
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">System terms</a>
          <a href="/contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}
