import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import ConversationBubble from "../../components/ConversationBubble/ConversationBubble.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import ReviewInteractionModal from "../../components/ReviewInteractionModal/ReviewInteractionModal.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { createAppSocket } from "../../config/socket.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getSessionUserId } from "../../commons/bookShared.js";
import "./MessagesPage.css";

const socket = createAppSocket();

function idString(ref) {
  if (ref == null) return "";
  if (typeof ref === "object") return String(ref._id ?? ref.id ?? "");
  return String(ref);
}

function formatTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatRelative(value) {
  const stamp = new Date(value).getTime();
  if (!Number.isFinite(stamp)) return "";
  const diff = Date.now() - stamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function requestInboxTab(request) {
  const status = String(request?.status ?? "").toLowerCase();
  const type = String(request?.type ?? "").toLowerCase();

  if (status === "cancelled") return null;
  if (status === "pending") return "ongoing";
  if (status === "declined" || status === "returned") return "archived";

  if (status === "accepted") {
    if (type === "borrow") {
      const end = request?.returnBy ? new Date(request.returnBy).getTime() : NaN;
      if (!Number.isFinite(end)) return "ongoing";
      return Date.now() > end ? "archived" : "ongoing";
    }
    return "archived";
  }

  return "ongoing";
}

function requestAllowsSending(request) {
  const status = String(request?.status ?? "").toLowerCase();
  const type = String(request?.type ?? "").toLowerCase();

  if (status === "cancelled") return false;
  if (status === "pending") return true;
  if (status === "declined" || status === "returned") return false;

  if (status === "accepted") {
    if (type === "borrow") {
      if (!request?.returnBy) return true;
      return new Date() <= new Date(request.returnBy);
    }
    return false;
  }

  return false;
}

function threadFromRequest(request, sessionUserId) {
  const requestId = idString(request._id ?? request.id);
  const ownerId = idString(request.bookOwner);
  const requesterId = idString(request.requesterId);
  const isOwner = ownerId === sessionUserId;
  const otherUser = isOwner ? request.requesterId : request.bookOwner;
  const otherUsername = otherUser?.username ? String(otherUser.username) : "reader";
  const selfUsername = isOwner ? request.bookOwner?.username : request.requesterId?.username;
  return {
    requestId,
    request,
    title: request.bookId?.bookTitle ?? "Untitled",
    partnerName: `@${otherUsername.replace(/^@/, "")}`,
    selfName: selfUsername ? `@${String(selfUsername).replace(/^@/, "")}` : "@you",
    status: String(request.status ?? "Pending"),
    updatedAt: request.updatedAt ?? request.createdAt,
  };
}

function threadFromInboxRow(row, sessionUserId) {
  const base = threadFromRequest(row.request, sessionUserId);
  const lastAt = row.lastMessageAt ?? base.updatedAt;
  return {
    ...base,
    lastMessagePreview: row.lastMessagePreview ?? "",
    lastMessageAt: row.lastMessageAt ?? null,
    unreadCount: Number(row.unreadCount) || 0,
    updatedAt: lastAt,
  };
}

export default function MessagesPage() {
  const { user, logout } = useAuth();
  const sessionUserId = getSessionUserId(user);

  const [threads, setThreads] = useState([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [threadError, setThreadError] = useState("");
  const [inboxTab, setInboxTab] = useState("ongoing");
  const [listSearch, setListSearch] = useState("");

  const [activeThreadId, setActiveThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [reviewInbox, setReviewInbox] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);

  const loadThreads = useCallback(async () => {
    setThreadLoading(true);
    setThreadError("");
    try {
      const response = await fetch(`${API}/messages/inbox`, {
        headers: { ...authHeader() },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok || !Array.isArray(data.threads)) {
        throw new Error(data.message ?? `Could not load conversations (${response.status})`);
      }
      const normalized = data.threads
        .map((row) => threadFromInboxRow(row, sessionUserId))
        .filter((thread) => thread.requestId)
        .filter((thread) => String(thread.request?.status ?? "").toLowerCase() !== "cancelled");
      setThreads(normalized);
      setActiveThreadId((prev) => {
        if (prev && normalized.some((t) => t.requestId === prev)) return prev;
        const ongoingFirst = normalized.find((t) => requestInboxTab(t.request) === "ongoing");
        const archivedFirst = normalized.find((t) => requestInboxTab(t.request) === "archived");
        return ongoingFirst?.requestId ?? archivedFirst?.requestId ?? "";
      });
    } catch (error) {
      setThreads([]);
      setThreadError(error.message ?? "Could not load conversations");
    } finally {
      setThreadLoading(false);
    }
  }, [logout, sessionUserId]);

  const loadMessages = useCallback(
    async (requestId) => {
      if (!requestId) return;
      setMessagesLoading(true);
      setMessagesError("");
      try {
        const response = await fetch(`${API}/messages/${encodeURIComponent(requestId)}`, {
          headers: { ...authHeader() },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data.message ?? `Could not load thread (${response.status})`);
        }
        setMessages(data);
      } catch (error) {
        setMessages([]);
        setMessagesError(error.message ?? "Could not load messages");
      } finally {
        setMessagesLoading(false);
      }
    },
    [logout],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    void loadMessages(activeThreadId);
  }, [activeThreadId, loadMessages]);

  useEffect(() => {
    if (!activeThreadId) return;
    socket.emit("join_thread", activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    socket.on("receive_message", (message) => {
      const incomingId = idString(message._id ?? message.id);
      const incomingRequestId = idString(message.requestId);
      setMessages((prev) => {
        if (incomingRequestId !== activeThreadId) return prev;
        const exists = prev.some((m) => idString(m._id ?? m.id) === incomingId);
        if (exists) return prev;
        return [...prev, message];
      });
    });
    return () => socket.off("receive_message");
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${API}/messages/${encodeURIComponent(activeThreadId)}/read`,
          {
            method: "PATCH",
            headers: { ...authHeader() },
          },
        );
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok || cancelled) return;
        setThreads((prev) =>
          prev.map((t) =>
            t.requestId === activeThreadId ? { ...t, unreadCount: 0 } : t,
          ),
        );
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId, logout]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.requestId === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  useEffect(() => {
    if (!activeThreadId || !activeThread) {
      setReviewInbox(null);
      return undefined;
    }
    const tab = requestInboxTab(activeThread.request);
    if (tab !== "archived") {
      setReviewInbox(null);
      return undefined;
    }
    const ty = String(activeThread.request?.type ?? "").toLowerCase();
    const st = String(activeThread.request?.status ?? "").toLowerCase();
    const mightReview =
      (ty === "borrow" && st === "returned") || (ty === "exchange" && st === "accepted");
    if (!mightReview) {
      setReviewInbox(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API}/reviews/eligibility/${encodeURIComponent(activeThreadId)}`,
          { headers: { ...authHeader() } },
        );
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!cancelled && res.ok) setReviewInbox(data);
        else if (!cancelled) setReviewInbox(null);
      } catch {
        if (!cancelled) setReviewInbox(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId, activeThread, logout]);

  const ongoingThreads = useMemo(
    () => threads.filter((t) => requestInboxTab(t.request) === "ongoing"),
    [threads],
  );
  const archivedThreads = useMemo(
    () => threads.filter((t) => requestInboxTab(t.request) === "archived"),
    [threads],
  );

  const tabThreads = useMemo(
    () => (inboxTab === "ongoing" ? ongoingThreads : archivedThreads),
    [inboxTab, ongoingThreads, archivedThreads],
  );

  const visibleThreads = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return tabThreads;
    return tabThreads.filter((t) => {
      const book = String(t.title ?? "").toLowerCase();
      const partner = String(t.partnerName ?? "").toLowerCase();
      return book.includes(q) || partner.includes(q);
    });
  }, [tabThreads, listSearch]);

  useEffect(() => {
    if (visibleThreads.some((t) => t.requestId === activeThreadId)) return;
    setActiveThreadId(visibleThreads[0]?.requestId ?? "");
  }, [visibleThreads, activeThreadId]);

  const canSendInActiveThread = activeThread
    ? requestAllowsSending(activeThread.request)
    : false;

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activeThreadId || !composer.trim() || sending || !canSendInActiveThread) return;
    setSending(true);
    try {
      const response = await fetch(`${API}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          requestId: activeThreadId,
          content: composer.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? `Could not send message (${response.status})`);
      }
      setComposer("");
      setMessages((previous) => [...previous, data]);
      socket.emit("message_sent", { requestId: activeThreadId, message: data });
      void loadThreads();
    } catch (error) {
      setMessagesError(error.message ?? "Could not send message");
    } finally {
      setSending(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="messages-page">
      <Header variant="user" />
      <main className="messages-main">
        <section className="messages-layout" aria-label="Inbox layout">
          <aside className="messages-sidebar" aria-label="Conversations">
            <header className="messages-sidebar-header">
              <h1 className="messages-page-title">Messages</h1>
              <label className="messages-search-label">
                <span className="visually-hidden">Search conversations</span>
                <input
                  type="search"
                  className="messages-search-input"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search conversations..."
                  autoComplete="off"
                />
              </label>
              <div className="messages-tabs" role="tablist" aria-label="Inbox sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={inboxTab === "ongoing"}
                  className={`messages-tab ${inboxTab === "ongoing" ? "messages-tab--active" : ""}`.trim()}
                  onClick={() => setInboxTab("ongoing")}
                >
                  Ongoing
                  <span className="messages-tab-count">{ongoingThreads.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inboxTab === "archived"}
                  className={`messages-tab ${inboxTab === "archived" ? "messages-tab--active" : ""}`.trim()}
                  onClick={() => setInboxTab("archived")}
                >
                  Archived
                  <span className="messages-tab-count">{archivedThreads.length}</span>
                </button>
              </div>
            </header>

            {threadLoading ? <p className="messages-hint">Loading conversations...</p> : null}
            {threadError ? <p className="messages-error">{threadError}</p> : null}

            {!threadLoading && !threadError && threads.length === 0 ? (
              <p className="messages-hint">No conversations yet. Accept a request to start messaging.</p>
            ) : null}

            {!threadLoading &&
            !threadError &&
            threads.length > 0 &&
            (inboxTab === "ongoing" ? ongoingThreads : archivedThreads).length === 0 ? (
              <p className="messages-hint">
                {inboxTab === "ongoing"
                  ? "No ongoing conversations. Finished swaps and closed borrows appear under Archived."
                  : "Nothing archived yet. Declined requests and completed swaps appear here; accepted borrows move here after the return date."}
              </p>
            ) : null}

            <ul className="messages-thread-list">
              {visibleThreads.map((thread) => {
                const isActive = thread.requestId === activeThreadId;
                return (
                  <li key={thread.requestId}>
                    <button
                      type="button"
                      className={`messages-thread-item ${isActive ? "messages-thread-item--active" : ""}`.trim()}
                      onClick={() => setActiveThreadId(thread.requestId)}
                    >
                      <span className="messages-thread-main">
                        <span className="messages-thread-user">{thread.partnerName}</span>
                        <span className="messages-thread-book">{thread.title}</span>
                        {thread.lastMessagePreview ? (
                          <span className="messages-thread-preview">
                            {thread.lastMessagePreview.length > 48
                              ? `${thread.lastMessagePreview.slice(0, 48)}…`
                              : thread.lastMessagePreview}
                          </span>
                        ) : null}
                      </span>
                      <span className="messages-thread-meta">
                        {thread.unreadCount > 0 ? (
                          <span className="messages-thread-unread" aria-label="Unread messages">
                            {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                          </span>
                        ) : null}
                        <span>{thread.status}</span>
                        <span>{formatRelative(thread.updatedAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="messages-chat" aria-label="Conversation">
            {!activeThread ? (
              <div className="messages-empty-state">
                <MaterialIcon name="chat" className="messages-empty-icon" />
                <p className="messages-hint">Select a conversation to view messages.</p>
              </div>
            ) : (
              <>
                <header className="messages-chat-header">
                  <div>
                    <p className="messages-chat-with">{activeThread.partnerName}</p>
                    <p className="messages-chat-title">
                      Viewing: {activeThread.title}
                      {activeThread.request?.type ? ` · ${activeThread.request.type}` : ""}
                    </p>
                  </div>
                </header>

                <div className="messages-chat-scroll">
                  {messagesLoading ? <p className="messages-hint">Loading thread...</p> : null}
                  {messagesError ? <p className="messages-error">{messagesError}</p> : null}

                  {!messagesLoading && !messagesError && messages.length === 0 ? (
                    <p className="messages-hint">No messages yet. Say hi to begin the conversation.</p>
                  ) : null}

                  <div className="messages-bubble-list">
                    {messages.map((message, index) => {
                      const messageId = idString(message._id ?? message.id) || `msg-${index}`;
                      const senderId = idString(
                        typeof message.senderId === "object" && message.senderId !== null
                          ? message.senderId._id ?? message.senderId.id
                          : message.senderId,
                      );
                      const isMe = senderId === sessionUserId;
                      return (
                        <ConversationBubble
                          key={messageId}
                          align={isMe ? "right" : "left"}
                          senderLabel={isMe ? undefined : activeThread.partnerName}
                          text={String(message.content ?? "")}
                          timestamp={formatTime(message.createdAt)}
                        />
                      );
                    })}
                  </div>
                </div>

                {reviewInbox?.eligible ? (
                  <div className="messages-review-cta" role="region" aria-label="Interaction review">
                    <p className="messages-review-cta-text">
                      This interaction is complete. You can rate it with {activeThread.partnerName}.
                    </p>
                    <button
                      type="button"
                      className="messages-review-cta-btn"
                      onClick={() =>
                        setReviewModal({
                          requestId: activeThreadId,
                          interactionLabel: activeThread.partnerName,
                        })
                      }
                    >
                      Rate interaction
                    </button>
                  </div>
                ) : null}

                {!canSendInActiveThread ? (
                  <p className="messages-readonly-banner" role="status">
                    {String(activeThread.request?.status ?? "").toLowerCase() === "cancelled"
                      ? "This request was cancelled — messaging is disabled."
                      : inboxTab === "archived" ||
                          String(activeThread.request?.status ?? "").toLowerCase() === "declined"
                        ? "This conversation is read-only."
                        : String(activeThread.request?.type ?? "").toLowerCase() === "borrow" &&
                            String(activeThread.request?.status ?? "").toLowerCase() === "accepted"
                          ? "The borrow period has ended — messaging is disabled."
                          : "Messaging is disabled for this request."}
                  </p>
                ) : null}

                <form className="messages-composer" onSubmit={sendMessage}>
                  <input
                    type="text"
                    className="messages-input"
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    placeholder="Type your message..."
                    maxLength={1000}
                    disabled={!canSendInActiveThread}
                  />
                  <button
                    type="submit"
                    className="messages-send-btn"
                    disabled={!composer.trim() || sending || !canSendInActiveThread}
                  >
                    <MaterialIcon name="send" className="messages-send-icon" />
                  </button>
                </form>
              </>
            )}
          </section>
        </section>
      </main>
      <Footer />
      <ReviewInteractionModal
        open={Boolean(reviewModal)}
        onClose={() => setReviewModal(null)}
        requestId={reviewModal?.requestId}
        interactionLabel={reviewModal?.interactionLabel}
        onSubmitted={() => void loadThreads()}
      />
    </div>
  );
}