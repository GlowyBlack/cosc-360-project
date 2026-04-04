import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { useBookCoverDisplaySrc } from "../../commons/bookShared.js";

export default function LibraryBookCard({
  bookId,
  title,
  author,
  coverSrc,
  coverAlt,
  isAvailable,
  requestCount = 0,
  likeCount = 0,
  onEdit,
  onDelete,
}) {
  const badgeLabel = isAvailable ? "AVAILABLE" : "ON LOAN";
  const { displaySrc, onImgError } = useBookCoverDisplaySrc(coverSrc);
  const showActions = Boolean(bookId && (onEdit || onDelete));

  const toggleAvailability = () => {

  }

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
          className={`library-book-card-badge ${
            isAvailable
              ? "library-book-card-badge--available"
              : "library-book-card-badge--loan"
          }`}
          onClick={() => {}}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="library-book-card-body">
        <div className="library-book-card-row">
          <h3 className="library-book-card-title">{title}</h3>
          <span className="library-book-card-likes" aria-hidden>
            <MaterialIcon name="favorite" className="library-book-card-heart" />
            <span className="library-book-card-like-count">{likeCount}</span>
          </span>
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