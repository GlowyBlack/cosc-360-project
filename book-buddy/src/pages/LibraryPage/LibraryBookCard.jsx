import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { useBookCoverDisplaySrc } from "../../commons/bookShared.js";

export default function LibraryBookCard({
  title,
  author,
  coverSrc,
  coverAlt,
  isAvailable,
  requestCount = 0,
  likeCount = 0,
}) {
  const badgeLabel = isAvailable ? "AVAILABLE" : "ON LOAN";
  const { displaySrc, onImgError } = useBookCoverDisplaySrc(coverSrc);

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
        <span
          className={`library-book-card-badge ${
            isAvailable
              ? "library-book-card-badge--available"
              : "library-book-card-badge--loan"
          }`}
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
          {String(author || "").toUpperCase()}
        </p>
        <p className="library-book-card-meta">
          {requestCount} ACTIVE {requestCount === 1 ? "REQUEST" : "REQUESTS"}
        </p>
      </div>
    </article>
  );
}
