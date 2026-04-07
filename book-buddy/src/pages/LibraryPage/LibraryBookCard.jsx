import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { useBookCoverDisplaySrc } from "../../commons/bookShared.js";

export default function LibraryBookCard({
  bookId,
  title,
  author,
  coverSrc,
  coverAlt,
  isAvailable,
  onLoan = false,
  requestCount = 0,
  onEdit,
  onDelete,
  onToggleAvailability,
  availabilityBusy = false,
}) {
  const badge =
    onLoan
      ? { label: "ON LOAN", tone: "loan" }
      : isAvailable
        ? { label: "AVAILABLE", tone: "available" }
        : { label: "NOT AVAILABLE", tone: "unavailable" };

  const { displaySrc, onImgError } = useBookCoverDisplaySrc(coverSrc);
  const showActions = Boolean(bookId && (onEdit || onDelete));
  const canToggleAvailability =
    !onLoan && typeof onToggleAvailability === "function";
  const availabilityLabel = isAvailable
    ? "Mark as not available for requests"
    : "Mark as available for requests";

  return (
    <article className="library-book-card">
      <div className="library-book-card-cover-wrap">
        <img
          src={displaySrc}
          alt={coverAlt || "No cover image"}
          className="library-book-card-cover"
          loading="lazy"
          onError={onImgError}
        />
        {showActions ? (
          <div className="library-book-card-actions">
            {typeof onEdit === "function" ? (
              <button
                type="button"
                className="library-book-card-action-btn"
                aria-label={`Edit ${title}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <MaterialIcon name="edit" className="library-book-card-action-icon" />
              </button>
            ) : null}
            {typeof onDelete === "function" ? (
              <button
                type="button"
                className="library-book-card-action-btn library-book-card-action-btn--danger"
                aria-label={`Delete ${title}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <MaterialIcon name="delete" className="library-book-card-action-icon" />
              </button>
            ) : null}
          </div>
        ) : null}
        <span
          className={`library-book-card-badge library-book-card-badge--${badge.tone}${canToggleAvailability ? " library-book-card-badge--clickable" : ""}${availabilityBusy ? " library-book-card-badge--busy" : ""}`.trim()}
          role={canToggleAvailability ? "button" : undefined}
          tabIndex={canToggleAvailability && !availabilityBusy ? 0 : undefined}
          aria-label={canToggleAvailability ? availabilityLabel : undefined}
          aria-busy={canToggleAvailability ? availabilityBusy : undefined}
          onClick={
            canToggleAvailability && !availabilityBusy
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleAvailability();
                }
              : undefined
          }
          onKeyDown={
            canToggleAvailability && !availabilityBusy
              ? (e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleAvailability();
                }
              : undefined
          }
        >
          {badge.label}
        </span>
      </div>
      <div className="library-book-card-body">
        <div className="library-book-card-row">
          <h3 className="library-book-card-title">{title}</h3>
        </div>
        <p className="library-book-card-author">
          {(author ?? "").toUpperCase()}
        </p>
        <p className="library-book-card-meta">
          {requestCount} ACTIVE {requestCount === 1 ? "REQUEST" : "REQUESTS"}
        </p>
      </div>
    </article>
  );
}
