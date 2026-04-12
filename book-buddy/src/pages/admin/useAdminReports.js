import { useCallback, useEffect, useMemo, useState } from "react";
import API, { authHeader } from "../../config/api.js";

export const PAGE_SIZE = 10;

export function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export function reporterDisplay(report) {
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

export function targetLink(targetType, targetId) {
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

export function clampText(s, max = 120) {
  const t = String(s ?? "").trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function buildReportsUrlWithQuery(statusFilter, typeFilter) {
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

export const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Open", label: "Open" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Dismissed", label: "Dismissed" },
];

export const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "Book", label: "Book" },
  { value: "User", label: "User" },
  { value: "Post", label: "Post" },
  { value: "Comment", label: "Comment" },
];

export function useAdminReports() {
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
      const res = await fetch(buildReportsUrlWithQuery(statusFilter, typeFilter), {
        headers: { ...authHeader() },
      });
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

  const openReportCount = useMemo(
    () => reports.filter((r) => String(r.status ?? "") === "Open").length,
    [reports],
  );

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

  return {
    reports,
    loading,
    error,
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
    loadReports,
    markReviewed,
    dismissReport,
    reopenReport,
    exportCsv,
  };
}
