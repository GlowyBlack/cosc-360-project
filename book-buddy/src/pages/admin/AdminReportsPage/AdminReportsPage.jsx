import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API, { authHeader } from "../../../config/api.js";
import "../admin-shared.css";
import "./AdminReportsPage.css";
import "../AdminDashboardPage/AdminDashboardPage.css";

const PAGE_SIZE = 10;
const PAGE_BUTTON_WINDOW = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Open", label: "Open" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Dismissed", label: "Dismissed" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "Book", label: "Book" },
  { value: "User", label: "User" },
  { value: "Post", label: "Post" },
  { value: "Comment", label: "Comment" },
];

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function reporterDisplay(report) {
  const r = report.reporterId;
  if (!r) return { label: "—", email: "" };
  if (typeof r === "object" && r._id) {
    return {
      label: r.username ?? "—",
      email: r.email ?? "",
    };
  }
  return { label: String(r).slice(0, 8) + "…", email: "" };
}

function targetLink(targetType, targetId) {
  const id = String(targetId ?? "");
  if (!id) return null;
  switch (targetType) {
    case "Book":
      return `/book/${id}`;
    case "User":
      return `/user/${id}`;
    case "Post":
      return `/blogs/${id}`;
    default:
      return null;
  }
}

function clampText(s, max = 120) {
  const t = String(s ?? "").trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function buildReportsUrlWithQuery(statusFilter, typeFilter) {
  const params = new URLSearchParams();
  if (statusFilter) params.set("status", statusFilter);
  if (typeFilter) params.set("targetType", typeFilter);
  const q = params.toString();
  return q ? `${API}/admin/reports?${q}` : `${API}/admin/reports`;
}

function escapeCsvField(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actingId, setActingId] = useState(null);
  const [page, setPage] = useState(1);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        buildReportsUrlWithQuery(statusFilter, typeFilter),
        { headers: { ...authHeader() } },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to load reports");
      }
      const data = await res.json().catch(() => ({}));
      setReports(normalizeListPayload(data));
    } catch (e) {
      setError(e.message ?? "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const { label, email } = reporterDisplay(r);
      const reason = String(r.reason ?? "").toLowerCase();
      const type = String(r.targetType ?? "").toLowerCase();
      const tid = String(r.targetId ?? "").toLowerCase();
      const status = String(r.status ?? "").toLowerCase();
      const hay = `${label} ${email} ${reason} ${type} ${tid} ${status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reports, query]);

  const totalPages = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    return Math.ceil(filteredReports.length / PAGE_SIZE);
  }, [filteredReports.length]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, typeFilter, reports.length]);

  useEffect(() => {
    if (totalPages === 0) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, page]);

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

  async function runReportAction(reportId, init) {
    setActingId(String(reportId));
    setActionError("");
    try {
      const res = await init();
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Action failed");
      }
      await loadReports();
    } catch (e) {
      setActionError(e.message ?? "Action failed");
    } finally {
      setActingId(null);
    }
  }

  function markReviewed(report) {
    const id = String(report._id);
    return runReportAction(id, () =>
      fetch(`${API}/admin/reports/${id}/resolve`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }),
    );
  }

  function dismissReport(report) {
    const id = String(report._id);
    return runReportAction(id, () =>
      fetch(`${API}/admin/reports/${id}`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dismissed" }),
      }),
    );
  }

  function reopenReport(report) {
    const id = String(report._id);
    return runReportAction(id, () =>
      fetch(`${API}/admin/reports/${id}/unresolve`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }),
    );
  }

  function exportCsv() {
    const rows = filteredReports;
    if (rows.length === 0) return;
    const header = [
      "id",
      "createdAt",
      "status",
      "targetType",
      "targetId",
      "reporterUsername",
      "reporterEmail",
      "reason",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      const { label, email } = reporterDisplay(r);
      lines.push(
        [
          escapeCsvField(r._id),
          escapeCsvField(r.createdAt),
          escapeCsvField(r.status),
          escapeCsvField(r.targetType),
          escapeCsvField(r.targetId),
          escapeCsvField(label),
          escapeCsvField(email),
          escapeCsvField(r.reason),
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page admin-reports">
      <header className="admin-reports__header">
        <div>
          <h1 className="admin-reports__title">Reports</h1>
          <p className="admin-reports__lede">
            Review user-submitted flags on books, profiles, posts, and comments.
            Filter by status or type, update moderation state, or export the
            current view as CSV.
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

      <div className="admin-reports__toolbar">
        <label className="admin-reports__search-label" htmlFor="admin-reports-q">
          Search loaded reports
        </label>
        <div className="admin-reports__filters">
          <input
            id="admin-reports-q"
            type="search"
            className="admin-reports__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Reporter, reason, target id, type…"
            autoComplete="off"
          />
          <label
            className="admin-reports__filter-label"
            htmlFor="admin-reports-status"
          >
            Status
          </label>
          <select
            id="admin-reports-status"
            className="admin-reports__select"
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
          <label
            className="admin-reports__filter-label"
            htmlFor="admin-reports-type"
          >
            Type
          </label>
          <select
            id="admin-reports-type"
            className="admin-reports__select"
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
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-reports__export"
            disabled={loading || filteredReports.length === 0}
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
        <span className="admin-reports__meta">
          {loading
            ? "Loading…"
            : filteredReports.length === 0
              ? "0 reports"
              : totalPages === 1
                ? `${filteredReports.length} report${filteredReports.length === 1 ? "" : "s"}`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredReports.length)} of ${filteredReports.length}`}
        </span>
      </div>

      <div className="admin-table-wrap admin-reports__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Reporter</th>
              <th>Type</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table__empty">
                  Loading reports…
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table__empty">
                  {reports.length === 0
                    ? statusFilter || typeFilter
                      ? "No reports match your filters."
                      : "No reports in the queue."
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
                    <td className="admin-reports__date">
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
                      <div className="admin-reports__reporter">
                        <span>{repName}</span>
                        {repEmail ? (
                          <span className="admin-reports__reporter-email">
                            {repEmail}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{r.targetType ?? "—"}</td>
                    <td className="admin-reports__target">
                      {href ? (
                        <Link className="admin-reports__link" to={href}>
                          Open
                        </Link>
                      ) : null}
                      <code className="admin-reports__target-id" title={tid}>
                        {tid.length > 10 ? `${tid.slice(0, 6)}…` : tid || "—"}
                      </code>
                    </td>
                    <td
                      className="admin-reports__reason"
                      title={reasonFull || undefined}
                    >
                      {clampText(reasonFull, 100)}
                    </td>
                    <td>
                      <span
                        className={`admin-reports__status admin-reports__status--${String(r.status ?? "open").toLowerCase()}`}
                      >
                        {r.status ?? "—"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-reports__actions">
                        {r.status === "Open" ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn--solid admin-reports__action-btn"
                              disabled={busy}
                              onClick={() => markReviewed(r)}
                            >
                              {busy ? "…" : "Reviewed"}
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-reports__action-btn"
                              disabled={busy}
                              onClick={() => dismissReport(r)}
                            >
                              Dismiss
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn--outline admin-reports__action-btn"
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

      {!loading && totalPages > 1 ? (
        <nav className="admin-reports__pagination" aria-label="Report pages">
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-reports__pagination-step"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="admin-reports__pagination-pages">
            {showPageWindow && windowStart > 1 ? (
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-reports__pagination-chunk"
                aria-label="Show previous group of pages"
                onClick={() => setPage(windowStart - 1)}
              >
                …
              </button>
            ) : null}
            {Array.from(
              { length: Math.max(0, windowEnd - windowStart + 1) },
              (_, i) => windowStart + i,
            ).map((pnum) => (
              <button
                key={pnum}
                type="button"
                className={
                  pnum === page
                    ? "admin-btn admin-btn--solid admin-reports__pagination-num is-active"
                    : "admin-btn admin-btn--outline admin-reports__pagination-num"
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
                className="admin-btn admin-btn--outline admin-reports__pagination-chunk"
                aria-label="Show next group of pages"
                onClick={() => setPage(windowEnd + 1)}
              >
                …
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--outline admin-reports__pagination-step"
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
