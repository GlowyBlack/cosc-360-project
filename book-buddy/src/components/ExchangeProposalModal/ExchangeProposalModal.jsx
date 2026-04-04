import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getBookAuthor,
  getBookRecordId,
  getBookTitle,
  getCoverUrlFromRaw,
  coverSrcOrFallback,
} from "../../commons/bookShared.js";
import "./ExchangeProposalModal.css";

const PAGE_SIZE = 4;

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object | null} props.targetBook — API book document (the listing being requested)
 * @param {string} props.ownerName — display name of the book owner (e.g. "Julian")
 * @param {(payload: { offeredBookIds: string[] }) => void} [props.onPropose]
 */
export default function ExchangeProposalModal({
  open,
  onClose,
  targetBook,
  ownerName,
  onPropose,
}) {
  const titleId = useId();
  const { logout } = useAuth();
  const [myBooks, setMyBooks] = useState([]);
  const [loadingShelf, setLoadingShelf] = useState(false);
  const [shelfError, setShelfError] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const targetId = targetBook ? getBookRecordId(targetBook) : "";
  const targetTitle = targetBook ? getBookTitle(targetBook) : "";
  const targetAuthor = targetBook ? getBookAuthor(targetBook) : "";
  const targetCoverUrl = targetBook ? getCoverUrlFromRaw(targetBook) : "";

  const shelfBooks = useMemo(
    () =>
      myBooks.filter((b) => String(getBookRecordId(b)) !== String(targetId)),
    [myBooks, targetId],
  );

  const totalPages = Math.max(1, Math.ceil(shelfBooks.length / PAGE_SIZE));
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageSlice = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return shelfBooks.slice(start, start + PAGE_SIZE);
  }, [shelfBooks, safePage]);

  const showBack = safePage > 0;
  const showNext = (safePage + 1) * PAGE_SIZE < shelfBooks.length;

  const loadShelf = useCallback(async () => {
    setLoadingShelf(true);
    setShelfError("");
    try {
      const response = await fetch(`${API}/books/me`, {
        headers: { ...authHeader() },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        onClose();
        return;
      }
      if (!response.ok) {
        throw new Error(
          data.message ?? data.detail ?? "Could not load your books",
        );
      }
      setMyBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setShelfError(e.message ?? "Could not load your books");
      setMyBooks([]);
    } finally {
      setLoadingShelf(false);
    }
  }, [logout, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    setPage(0);
    setSelectedIds(new Set());
    loadShelf();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, loadShelf]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleSelect = (id) => {
    const sid = String(id);
    setSelectedIds((prev) => {
      if (prev.has(sid)) {
        return new Set();
      }
      return new Set([sid]);
    });
  };

  const handlePropose = () => {
    if (selectedIds.size === 0) return;
    if (typeof onPropose === "function") {
      onPropose({ offeredBookIds: [...selectedIds] });
    }
    onClose();
  };

  if (!open || !targetBook) return null;

  const portal = (
    <div
      className="exchange-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="exchange-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="exchange-modal-header">
          <div className="exchange-modal-header-text">
            <h2 id={titleId} className="exchange-modal-title">
              Propose an Exchange
            </h2>
            <p className="exchange-modal-subtitle">
              Select a book from your library to offer{" "}
              {ownerName ? (
                <strong className="exchange-modal-subtitle-name">
                  {ownerName}
                </strong>
              ) : (
                "the owner"
              )}
              .
            </p>
          </div>
          <button
            type="button"
            className="exchange-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </header>

        <div className="exchange-modal-trading">
          <img
            src={coverSrcOrFallback(targetCoverUrl)}
            alt=""
            className="exchange-modal-trading-thumb"
          />
          <div className="exchange-modal-trading-copy">
            <p className="exchange-modal-trading-label">Trading for</p>
            <p className="exchange-modal-trading-title">{targetTitle}</p>
            {targetAuthor ? (
              <p className="exchange-modal-trading-author">{targetAuthor}</p>
            ) : null}
          </div>
          <MaterialIcon
            name="swap_horiz"
            className="exchange-modal-trading-icon"
            aria-hidden
          />
        </div>

        <section className="exchange-modal-shelf">
          <h3 className="exchange-modal-shelf-label">Available in my shelf</h3>

          {loadingShelf ? (
            <p className="exchange-modal-shelf-state">Loading your books…</p>
          ) : null}
          {shelfError ? (
            <p className="exchange-modal-shelf-state exchange-modal-shelf-state--error">
              {shelfError}
            </p>
          ) : null}

          {!loadingShelf && !shelfError && shelfBooks.length === 0 ? (
            <p className="exchange-modal-shelf-state">
              You have no other books listed to offer. Add books in your library
              first.
            </p>
          ) : null}

          {!loadingShelf && !shelfError && pageSlice.length > 0 ? (
            <ul className="exchange-modal-list" role="list">
              {pageSlice.map((b) => {
                const id = getBookRecordId(b);
                const sid = String(id);
                const checked = selectedIds.has(sid);
                const t = getBookTitle(b);
                const a = getBookAuthor(b);
                const url = getCoverUrlFromRaw(b);
                const cond = b.condition ?? "";
                return (
                  <li key={sid} className="exchange-modal-row">
                    <label className="exchange-modal-row-label">
                      <input
                        type="checkbox"
                        className="exchange-modal-checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(id)}
                      />
                      <img
                        src={coverSrcOrFallback(url)}
                        alt=""
                        className="exchange-modal-row-cover"
                      />
                      <div className="exchange-modal-row-meta">
                        <span className="exchange-modal-row-title">{t}</span>
                        <span className="exchange-modal-row-author">{a}</span>
                      </div>
                      {cond ? (
                        <span className="exchange-modal-row-condition">
                          {cond}
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {(showBack || showNext) && !loadingShelf && !shelfError ? (
            <div className="exchange-modal-pagination">
              {showBack ? (
                <button
                  type="button"
                  className="exchange-modal-page-btn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Back
                </button>
              ) : (
                <span className="exchange-modal-page-spacer" aria-hidden />
              )}
              {showNext ? (
                <button
                  type="button"
                  className="exchange-modal-page-btn"
                  onClick={() =>
                    setPage((p) => {
                      const maxPage = Math.max(
                        0,
                        Math.ceil(shelfBooks.length / PAGE_SIZE) - 1,
                      );
                      return Math.min(maxPage, p + 1);
                    })
                  }
                >
                  Next
                </button>
              ) : (
                <span className="exchange-modal-page-spacer" aria-hidden />
              )}
            </div>
          ) : null}
        </section>

        <footer className="exchange-modal-footer">
          <p className="exchange-modal-hint">
            Choose one book to offer; selecting another replaces your choice.
          </p>
          <div className="exchange-modal-actions">
            <button
              type="button"
              className="exchange-modal-btn exchange-modal-btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="exchange-modal-btn exchange-modal-btn--submit"
              disabled={selectedIds.size === 0}
              onClick={handlePropose}
            >
              Propose exchange
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}
