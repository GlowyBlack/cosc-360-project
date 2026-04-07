import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import ExchangeProposalModal from "../../components/ExchangeProposalModal/ExchangeProposalModal.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import {
  getBookAuthor,
  getBookRecordId,
  getBookTitle,
  getBookOwnerId,
  getCoverUrlFromRaw,
  getSessionUserId,
  useBookCoverDisplaySrc,
} from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { io } from "socket.io-client";
import "./BookDetailPage.css";

// create one socket connection for this page
// used to notify the book owner in real time when an exchange is proposed
const socket = io("http://localhost:5001");

export default function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownerAvatarFailed, setOwnerAvatarFailed] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);

  const closeExchange = useCallback(() => setExchangeOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!bookId || !/^[a-f\d]{24}$/i.test(String(bookId).trim())) {
        setError("Invalid book link.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API}/books/${encodeURIComponent(bookId)}`,
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data.message ?? data.detail ?? "Could not load this book",
          );
        }
        if (!cancelled) setBook(data);
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? "Could not load this book");
          setBook(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const title = book ? getBookTitle(book) : "";
  const author = book ? getBookAuthor(book) : "";
  const coverUrl = book ? getCoverUrlFromRaw(book) : "";
  const coverAlt =
    coverUrl && title ? `Cover: ${title}` : "No cover image";
  const { displaySrc, onImgError } = useBookCoverDisplaySrc(coverUrl);

  useEffect(() => {
    setOwnerAvatarFailed(false);
    setExchangeOpen(false);
  }, [bookId]);

  const ownerName = useMemo(() => {
    if (!book?.bookOwner || typeof book.bookOwner !== "object") {
      return "Community member";
    }
    return book.bookOwner.username ?? "Community member";
  }, [book]);

  const ownerAvatarUrl =
    book?.bookOwner &&
    typeof book.bookOwner === "object" &&
    book.bookOwner.profileImage
      ? String(book.bookOwner.profileImage).trim()
      : "";

  const isAvailable = book?.isAvailable === true;
  const ownerId = book ? getBookOwnerId(book) : "";
  const sessionId = getSessionUserId(user);
  const isOwner = Boolean(ownerId && sessionId && ownerId === sessionId);

  const description =
    book?.description != null && String(book.description).trim() !== ""
      ? String(book.description).trim()
      : null;
  const ownerNote =
    book?.ownerNote != null && String(book.ownerNote).trim() !== ""
      ? String(book.ownerNote).trim()
      : null;
  const conditionLabel = book?.condition ?? "";

  const recordId = book ? getBookRecordId(book) : "";

  const handleBack = () => {
    navigate(-1);
  };

  const actionsDisabled = !isAvailable || !user;

  const handleProposeExchange = useCallback(
    async ({ offeredBookIds }) => {
      const offeredBookId = offeredBookIds[0];
      const targetBookId = bookId ? String(bookId).trim() : "";
      const obid = offeredBookId ? String(offeredBookId).trim() : "";
      if (!/^[a-f\d]{24}$/i.test(targetBookId)) {
        throw new Error("Invalid book.");
      }
      if (!/^[a-f\d]{24}$/i.test(obid)) {
        throw new Error("Invalid offered book.");
      }

      const verifyRes = await fetch(
        `${API}/books/${encodeURIComponent(targetBookId)}`,
      );
      const freshBook = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        throw new Error(
          freshBook.message ??
            freshBook.detail ??
            "Could not verify this listing.",
        );
      }
      if (freshBook.isAvailable !== true) {
        throw new Error("This book is no longer available to request.");
      }
      const oid = String(getBookOwnerId(freshBook)).trim();
      if (!/^[a-f\d]{24}$/i.test(oid)) {
        throw new Error("Could not determine the current owner. Try again.");
      }

      const response = await fetch(`${API}/requests/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          bookId: targetBookId,
          ownerId: oid,
          offeredBookId: obid,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        throw new Error(
          data.message ?? "Session expired. Please sign in again.",
        );
      }
      if (!response.ok) {
        throw new Error(
          data.error ??
            data.detail ??
            data.message ??
            "Could not send exchange proposal.",
        );
      }

      // exchange saved successfully
      // notify the book owner in real time so their RequestPage updates instantly
      // oid is the owner's userId — they are in a socket room named after their id
      socket.emit("new_request", { ownerId: oid });
    },
    [bookId, logout],
  );

  return (
    <div className="book-detail-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="book-detail-page-main">
        <button
          type="button"
          className="book-detail-back"
          onClick={handleBack}
        >
          <MaterialIcon name="west" className="book-detail-back-icon" aria-hidden />
          <span>Back</span>
        </button>

        {loading ? (
          <p className="book-detail-state">Loading…</p>
        ) : null}
        {error ? (
          <p className="book-detail-state book-detail-state--error">{error}</p>
        ) : null}

        {!loading && !error && book ? (
          <div className="book-detail-layout">
            <div className="book-detail-col book-detail-col--media">
              <div className="book-detail-cover-frame">
                <img
                  src={displaySrc}
                  alt={coverAlt}
                  className="book-detail-cover"
                  onError={onImgError}
                />
                <div className="book-detail-badges">
                  <span
                    className={`book-detail-badge book-detail-badge--status ${
                      isAvailable
                        ? "book-detail-badge--available"
                        : "book-detail-badge--unavailable"
                    }`.trim()}
                  >
                    {isAvailable ? "Available now" : "Unavailable"}
                  </span>
                  {conditionLabel ? (
                    <span className="book-detail-badge book-detail-badge--condition">
                      {conditionLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="book-detail-owner">
                <div className="book-detail-owner-avatar-wrap">
                  {ownerAvatarUrl && !ownerAvatarFailed ? (
                    <img
                      src={ownerAvatarUrl}
                      alt=""
                      className="book-detail-owner-avatar"
                      onError={() => setOwnerAvatarFailed(true)}
                    />
                  ) : (
                    <span className="book-detail-owner-fallback" aria-hidden>
                      <MaterialIcon
                        name="person"
                        className="book-detail-owner-fallback-icon"
                      />
                    </span>
                  )}
                </div>
                <p className="book-detail-owner-name">{ownerName}</p>
              </div>
            </div>

            <div className="book-detail-col book-detail-col--info">
              <h1 className="book-detail-title">{title}</h1>
              <p className="book-detail-author">By {author}</p>

              <section className="book-detail-section">
                <h2 className="book-detail-section-label">Summary</h2>
                <p className="book-detail-section-body">
                  {description ??
                    "No summary has been added for this listing yet."}
                </p>
              </section>

              <section className="book-detail-section">
                <h2 className="book-detail-section-label">Condition detail</h2>
                <p className="book-detail-section-body book-detail-section-body--note">
                  {ownerNote ??
                    "The owner has not added extra condition notes."}
                </p>
              </section>

              {!isOwner ? (
                <div className="book-detail-actions">
                  <button
                    type="button"
                    className={`book-detail-action book-detail-action--borrow ${
                      actionsDisabled ? "book-detail-action--disabled" : ""
                    }`.trim()}
                    disabled={actionsDisabled}
                  >
                    Request to borrow
                    <MaterialIcon
                      name="arrow_forward"
                      className="book-detail-action-icon"
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    className={`book-detail-action book-detail-action--exchange ${
                      actionsDisabled ? "book-detail-action--disabled" : ""
                    }`.trim()}
                    disabled={actionsDisabled}
                    onClick={() => setExchangeOpen(true)}
                  >
                    Propose exchange
                  </button>
                </div>
              ) : null}

              <div className="book-detail-footer-row">
                <span className="book-detail-id">ID: {recordId}</span>
                <div className="book-detail-util-icons">
                  <button
                    type="button"
                    className="book-detail-util-btn"
                    aria-label="Share"
                  >
                    <MaterialIcon name="share" />
                  </button>
                  <button
                    type="button"
                    className="book-detail-util-btn"
                    aria-label="Bookmark"
                  >
                    <MaterialIcon name="bookmark_border" />
                  </button>
                  <button
                    type="button"
                    className="book-detail-util-btn"
                    aria-label="Report"
                  >
                    <MaterialIcon name="flag" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      {book ? (
        <ExchangeProposalModal
          open={exchangeOpen}
          onClose={closeExchange}
          targetBook={book}
          ownerName={ownerName}
          onPropose={handleProposeExchange}
        />
      ) : null}
      <Footer />
    </div>
  );
}