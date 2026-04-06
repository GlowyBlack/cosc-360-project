import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import {
  coverSrcOrFallback,
  getSessionUserId,
} from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./RequestPage.css";

const LIST_PAGE_SIZE = 5;

function normalizeRequestPayload(data) {
  if (Array.isArray(data)) return data;
  if (data?.requests && Array.isArray(data.requests)) return data.requests;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

function idString(ref) {
  if (ref == null) return "";
  if (typeof ref === "object") return String(ref._id ?? ref.id ?? "");
  return String(ref);
}

function userDisplayName(ref) {
  if (ref && typeof ref === "object" && ref.username) {
    return `@${String(ref.username).replace(/^@/, "")}`;
  }
  return "@reader";
}

function bookTitleFromRef(ref) {
  if (ref && typeof ref === "object") {
    return ref.bookTitle ?? ref.title ?? "Untitled";
  }
  return "Book";
}

function bookCoverFromRef(ref) {
  if (ref && typeof ref === "object") {
    const u = ref.bookImage ?? ref.cover?.src ?? "";
    return u ? String(u) : "";
  }
  return "";
}

function formatRelativePast(dateInput) {
  const t = dateInput ? new Date(dateInput).getTime() : NaN;
  if (!Number.isFinite(t)) return "";
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(t).toLocaleDateString();
}

function formatDueIn(returnBy) {
  const end = new Date(returnBy).getTime();
  if (!Number.isFinite(end)) return "";
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

function borrowProgressPct(createdAt, returnBy) {
  const start = new Date(createdAt).getTime();
  const end = new Date(returnBy).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 40;
  }
  const p = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(p)));
}

function proposedBorrowDurationDays(createdAt, returnBy) {
  const start = new Date(createdAt).getTime();
  const end = new Date(returnBy).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return Math.max(1, Math.round((end - start) / 86400000));
}

function requestTypeNorm(t) {
  return String(t ?? "").toLowerCase();
}

function statusNorm(s) {
  return String(s ?? "").toLowerCase();
}

function normalizedStatus(raw) {
  const r = String(raw ?? "");
  return statusNorm(r === "Rejected" ? "Declined" : r);
}

function isHistoryStatus(rawStatus) {
  const st = normalizedStatus(rawStatus);
  return ["accepted", "returned", "cancelled", "declined"].includes(st);
}

function RequestPageCard({
  req,
  direction,
  isHistory,
  onAccept,
  onDecline,
  onCancel,
  onMessage,
  actionError,
  busyId,
}) {
  const id = idString(req._id ?? req.id);
  const type = requestTypeNorm(req.type);
  const status = normalizedStatus(req.status);
  const isExchange = type === "exchange";
  const primaryBook = req.bookId;
  const offeredBook = req.offeredBookId;
  const title = bookTitleFromRef(primaryBook);
  const offeredTitle = bookTitleFromRef(offeredBook);
  const cover = bookCoverFromRef(primaryBook);
  const offeredCover = bookCoverFromRef(offeredBook);
  const ownerName = userDisplayName(req.bookOwner);
  const requesterName = userDisplayName(req.requesterId);
  const created = req.createdAt;
  const returnBy = req.returnBy;

  const counterparty = direction === "incoming" ? requesterName : ownerName;
  const relTime = formatRelativePast(created);
  const dueLine = formatDueIn(returnBy);
  const durationDays = proposedBorrowDurationDays(created, returnBy);
  const progress = borrowProgressPct(created, returnBy);

  let badgeClass = "request-page-card-badge ";
  let badgeText =
    status === "declined" || status === "cancelled"
      ? status === "cancelled"
        ? "CANCELLED"
        : "DECLINED"
      : String(req.status ?? "Pending").toUpperCase();
  if (status === "pending") badgeClass += "request-page-card-badge--pending";
  else if (status === "accepted") {
    badgeClass += "request-page-card-badge--active";
    badgeText = isExchange ? "ACCEPTED" : "BORROWED";
  } else if (status === "returned") {
    badgeClass += "request-page-card-badge--muted";
    badgeText = "RETURNED";
  } else {
    badgeClass += "request-page-card-badge--muted";
  }

  const showPendingActions =
    !isHistory &&
    direction === "incoming" &&
    status === "pending" &&
    typeof onAccept === "function";

  const showMessage =
    !isHistory &&
    status === "accepted" &&
    !isExchange &&
    typeof onMessage === "function";

  const showRate = !isHistory && status === "returned";
  const showCompletedBtn =
    isHistory ||
    status === "returned" ||
    status === "declined" ||
    status === "cancelled";

  const showAwaiting =
    !isHistory && direction === "outgoing" && status === "pending";
  const showCancelOutgoing =
    showAwaiting && typeof onCancel === "function";

  const historyLabel =
    status === "returned"
      ? "Completed"
      : status === "accepted"
        ? isExchange
          ? "Accepted"
          : "Active / past"
        : status === "cancelled"
          ? "Cancelled"
          : status === "declined"
            ? "Declined"
            : "Closed";

  return (
    <article
      className={`request-page-card ${isHistory ? "request-page-card--history" : ""}`.trim()}
    >
      <div className="request-page-card-media">
        <img src={coverSrcOrFallback(cover)} alt="" className="request-page-card-cover" />
        {isExchange && offeredBook ? (
          <>
            <span className="request-page-card-swap" aria-hidden>⇄</span>
            <img src={coverSrcOrFallback(offeredCover)} alt="" className="request-page-card-cover" />
          </>
        ) : null}
      </div>

      <div className="request-page-card-body">
        <div className="request-page-card-topline">
          <span className={badgeClass}>{badgeText}</span>
          {relTime ? <span className="request-page-card-time">{relTime}</span> : null}
          {status === "accepted" && !isExchange && dueLine && !isHistory ? (
            <span className="request-page-card-due">{dueLine}</span>
          ) : null}
        </div>

        {isExchange ? (
          <h3 className="request-page-card-title">{title} ⇄ {offeredTitle}</h3>
        ) : (
          <h3 className="request-page-card-title">{title}</h3>
        )}

        {isExchange ? (
          <p className="request-page-card-line">
            {direction === "incoming"
              ? `${requesterName} proposes an exchange`
              : `You proposed to ${ownerName}`}
          </p>
        ) : (
          <p className="request-page-card-line">
            {direction === "incoming"
              ? `Requested by ${counterparty} • Lending`
              : `You requested from ${counterparty}`}
          </p>
        )}

        {isHistory ? <p className="request-page-card-meta-upper">History</p> : null}

        {!isExchange && status === "pending" && durationDays != null && direction === "incoming" ? (
          <p className="request-page-card-meta-upper">
            Proposed duration: {durationDays} day{durationDays === 1 ? "" : "s"}
          </p>
        ) : null}

        {status === "accepted" && !isExchange && !isHistory ? (
          <div
            className="request-page-card-progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="request-page-card-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        ) : null}

        {showRate ? (
          <button type="button" className="request-page-card-rate" disabled>
            <MaterialIcon name="star" className="request-page-card-rate-icon" />
            Rate this exchange
          </button>
        ) : null}

        {actionError && busyId === id ? (
          <p className="request-page-card-inline-error" role="alert">{actionError}</p>
        ) : null}
      </div>

      <div className="request-page-card-actions">
        {showPendingActions ? (
          <>
            <button
              type="button"
              className="request-page-btn request-page-btn--ghost"
              disabled={busyId === id}
              onClick={() => onDecline(id)}
            >
              Decline
            </button>
            <button
              type="button"
              className="request-page-btn request-page-btn--solid"
              disabled={busyId === id}
              onClick={() => onAccept(id)}
            >
              Accept
            </button>
          </>
        ) : null}
        {showMessage ? (
          <button
            type="button"
            className="request-page-btn request-page-btn--ghost"
            onClick={() => onMessage(id)}
          >
            Message
          </button>
        ) : null}
        {showCompletedBtn && !showPendingActions && !showMessage ? (
          <span className="request-page-btn request-page-btn--done" aria-disabled>
            {isHistory ? historyLabel : status === "returned" ? "Completed" : "Closed"}
          </span>
        ) : null}
        {showCancelOutgoing ? (
          <>
            <button
              type="button"
              className="request-page-btn request-page-btn--ghost"
              disabled={busyId === id}
              onClick={() => onCancel(id)}
            >
              Cancel
            </button>
            <span className="request-page-awaiting">Awaiting response</span>
          </>
        ) : showAwaiting ? (
          <span className="request-page-awaiting">Awaiting response</span>
        ) : null}
      </div>
    </article>
  );
}

export default function RequestPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const sessionId = getSessionUserId(user);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hubMode, setHubMode] = useState("borrow");
  const [listTab, setListTab] = useState("incoming");
  const [actionBusyId, setActionBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const [listPage, setListPage] = useState(0);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`${API}/requests/me`, {
        headers: { ...authHeader() },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(
          data.message ?? data.detail ?? `Could not load requests (${response.status})`,
        );
      }
      setRequests(normalizeRequestPayload(data));
    } catch (e) {
      setLoadError(e.message ?? "Could not load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const socket = io("http://localhost:5001");
    if (sessionId) socket.emit("join_user_room", sessionId);
    socket.on("request_update", () => {
      loadRequests();
    });
    return () => socket.disconnect();
  }, [sessionId, loadRequests]);

  useEffect(() => {
    setListPage(0);
  }, [listTab, hubMode]);

  const filteredByType = useMemo(() => {
    return requests.filter((r) => {
      const t = requestTypeNorm(r.type);
      if (hubMode === "borrow") return t === "borrow";
      return t === "exchange";
    });
  }, [requests, hubMode]);

  const incomingPending = useMemo(
    () =>
      filteredByType.filter(
        (r) =>
          idString(r.bookOwner) === sessionId &&
          normalizedStatus(r.status) === "pending",
      ),
    [filteredByType, sessionId],
  );

  const outgoingPending = useMemo(
    () =>
      filteredByType.filter(
        (r) =>
          idString(r.requesterId) === sessionId &&
          normalizedStatus(r.status) === "pending",
      ),
    [filteredByType, sessionId],
  );

  const history = useMemo(
    () =>
      filteredByType.filter((r) => {
        if (!isHistoryStatus(r.status)) return false;
        const oid = idString(r.bookOwner);
        const rid = idString(r.requesterId);
        return oid === sessionId || rid === sessionId;
      }),
    [filteredByType, sessionId],
  );

  const activeList = useMemo(() => {
    if (listTab === "incoming") return incomingPending;
    if (listTab === "outgoing") return outgoingPending;
    return history;
  }, [listTab, incomingPending, outgoingPending, history]);

  const maxListPage = Math.max(0, Math.ceil(activeList.length / LIST_PAGE_SIZE) - 1);
  const safeListPage = Math.min(listPage, maxListPage);

  const pagedList = useMemo(() => {
    const start = safeListPage * LIST_PAGE_SIZE;
    return activeList.slice(start, start + LIST_PAGE_SIZE);
  }, [activeList, safeListPage]);

  const showListBack = safeListPage > 0;
  const showListNext = (safeListPage + 1) * LIST_PAGE_SIZE < activeList.length;

  useEffect(() => {
    const maxP = Math.max(0, Math.ceil(activeList.length / LIST_PAGE_SIZE) - 1);
    setListPage((p) => Math.min(p, maxP));
  }, [activeList.length]);

  const pendingIncomingCount = useMemo(
    () =>
      requests.filter(
        (r) =>
          idString(r.bookOwner) === sessionId &&
          normalizedStatus(r.status) === "pending",
      ).length,
    [requests, sessionId],
  );

  const emptyMessage = useMemo(() => {
    if (listTab === "incoming") {
      return hubMode === "borrow"
        ? "No pending borrow requests to you. When someone asks to borrow your book, it will appear here."
        : "No pending exchange proposals to you.";
    }
    if (listTab === "outgoing") {
      return hubMode === "borrow"
        ? "You have no outgoing borrow requests waiting on a response."
        : "You have no outgoing exchange proposals waiting on a response.";
    }
    return hubMode === "borrow"
      ? "No past borrow activity yet. Accepted, cancelled, and declined borrows show here."
      : "No past exchange activity yet. Accepted, cancelled, and declined exchanges show here.";
  }, [listTab, hubMode]);

  const respondToRequest = useCallback(
    async (requestId, decision, kind) => {
      setActionError("");
      setActionBusyId(requestId);
      const sub = decision === "accept" ? "accept" : "decline";
      const segment = kind === "exchange" ? "exchange" : "borrow";
      const url = `${API}/requests/${segment}/${encodeURIComponent(requestId)}/${sub}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({ requestId }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(
            data.error ?? data.detail ?? data.message ??
              (response.status === 404 ? "Not found." : `Request failed (${response.status})`),
          );
        }
        await loadRequests();
      } catch (e) {
        setActionError(e.message ?? "Action failed");
      } finally {
        setActionBusyId("");
      }
    },
    [loadRequests, logout],
  );

  const cancelOutgoingRequest = useCallback(
    async (requestId, kind) => {
      setActionError("");
      setActionBusyId(requestId);
      const segment = kind === "exchange" ? "exchange" : "borrow";
      const url = `${API}/requests/${segment}/${encodeURIComponent(requestId)}/cancel`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({ requestId }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(
            data.error ??
              data.detail ??
              data.message ??
              (response.status === 404
                ? "Not found."
                : `Request failed (${response.status})`),
          );
        }
        await loadRequests();
      } catch (e) {
        setActionError(e.message ?? "Could not cancel request");
      } finally {
        setActionBusyId("");
      }
    },
    [loadRequests, logout],
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="request-page">
      <Header variant="user" requestPendingCount={pendingIncomingCount} />
      <main className="request-page-main">
        <header className="request-page-hero">
          <div className="request-page-hero-text">
            <h1 className="request-page-hero-title">Requests</h1>
          </div>
          <div className="request-page-toggle" role="group" aria-label="Request kind">
            <button
              type="button"
              className={`request-page-toggle-btn ${hubMode === "borrow" ? "request-page-toggle-btn--on" : ""}`.trim()}
              onClick={() => setHubMode("borrow")}
            >
              Borrow requests
            </button>
            <button
              type="button"
              className={`request-page-toggle-btn ${hubMode === "exchange" ? "request-page-toggle-btn--on" : ""}`.trim()}
              onClick={() => setHubMode("exchange")}
            >
              Exchange proposals
            </button>
          </div>
        </header>

        <div className="request-page-tabs" role="tablist" aria-label="Request lists">
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "incoming"}
            className={`request-page-tab ${listTab === "incoming" ? "request-page-tab--active" : ""}`.trim()}
            onClick={() => setListTab("incoming")}
          >
            Incoming ({incomingPending.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "outgoing"}
            className={`request-page-tab ${listTab === "outgoing" ? "request-page-tab--active" : ""}`.trim()}
            onClick={() => setListTab("outgoing")}
          >
            Outgoing ({outgoingPending.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "history"}
            className={`request-page-tab ${listTab === "history" ? "request-page-tab--active" : ""}`.trim()}
            onClick={() => setListTab("history")}
          >
            History ({history.length})
          </button>
        </div>

        {loadError ? (
          <div className="request-page-banner request-page-banner--error" role="alert">
            <p className="request-page-banner-text">{loadError}</p>
            <p className="request-page-banner-hint">
              The list expects a working <code>GET /requests/me</code> response.
            </p>
            <button
              type="button"
              className="request-page-banner-retry"
              onClick={() => void loadRequests()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? <p className="request-page-state">Loading requests…</p> : null}

        {!loading && !loadError && activeList.length === 0 ? (
          <p className="request-page-state request-page-state--empty">{emptyMessage}</p>
        ) : null}

        {!loading && activeList.length > 0 ? (
          <>
            <ul className="request-page-list" aria-label="Requests">
              {pagedList.map((req, index) => {
                const rid = idString(req._id ?? req.id);
                const direction = idString(req.bookOwner) === sessionId ? "incoming" : "outgoing";
                const isHistory = listTab === "history";
                const requestKind = requestTypeNorm(req.type) === "exchange" ? "exchange" : "borrow";
                return (
                  <li key={rid || `request-${safeListPage}-${index}`} className="request-page-list-item">
                    <RequestPageCard
                      req={req}
                      direction={direction}
                      isHistory={isHistory}
                      busyId={actionBusyId}
                      actionError={actionError}
                      onAccept={isHistory ? undefined : (id) => void respondToRequest(id, "accept", requestKind)}
                      onDecline={isHistory ? undefined : (id) => void respondToRequest(id, "decline", requestKind)}
                      onMessage={isHistory ? undefined : () => navigate("/messages")}
                      onCancel={
                        isHistory || direction !== "outgoing"
                          ? undefined
                          : (id) =>
                              void cancelOutgoingRequest(id, requestKind)
                      }
                    />
                  </li>
                );
              })}
            </ul>
            {showListBack || showListNext ? (
              <div className="request-page-pagination">
                {showListBack ? (
                  <button
                    type="button"
                    className="request-page-btn request-page-btn--ghost"
                    onClick={() => setListPage((p) => Math.max(0, p - 1))}
                  >
                    Back
                  </button>
                ) : (
                  <span className="request-page-page-spacer" aria-hidden />
                )}
                {showListNext ? (
                  <button
                    type="button"
                    className="request-page-btn request-page-btn--ghost"
                    onClick={() =>
                      setListPage((p) => {
                        const maxP = Math.max(0, Math.ceil(activeList.length / LIST_PAGE_SIZE) - 1);
                        return Math.min(maxP, p + 1);
                      })
                    }
                  >
                    Next
                  </button>
                ) : (
                  <span className="request-page-page-spacer" aria-hidden />
                )}
              </div>
            ) : null}
          </>
        ) : null}

        <section className="request-page-footer-cta" aria-labelledby="request-page-quote">
          <MaterialIcon name="auto_stories" className="request-page-footer-icon" aria-hidden />
          <blockquote id="request-page-quote" className="request-page-quote">
            A house without books is like a room without windows.
            <footer className="request-page-quote-cite">— Horace Mann</footer>
          </blockquote>
          <Link to="/" className="request-page-browse">Browse more books</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
