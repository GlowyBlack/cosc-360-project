import { useEffect, useRef, useState } from "react";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import { FALLBACK_BOOK_COVER_IMAGE } from "../../config/images.js";
import "./BookCard.css";

export default function BookCard({
  cover,
  title,
  author,
  owner,
  location,
  status,
  wishlisted = false,
  onToggleWishlist,
  onClick,
}) {
  const interactive = typeof onClick === "function";
  const rawSrc =
    typeof cover === "string" ? cover : cover?.src;
  const trimmed = rawSrc != null ? String(rawSrc).trim() : "";
  const coverSrc = trimmed ? trimmed : FALLBACK_BOOK_COVER_IMAGE;
  const coverAlt =
    typeof cover === "string"
      ? trimmed
        ? ""
        : "No cover image"
      : cover?.alt ?? (trimmed ? "" : "No cover image");

  const [displaySrc, setDisplaySrc] = useState(coverSrc);
  const fallbackOnce = useRef(false);
  useEffect(() => {
    setDisplaySrc(coverSrc);
    fallbackOnce.current = false;
  }, [coverSrc]);

  return (
    <article
      className={`book-card ${interactive ? "book-card--interactive" : ""}`.trim()}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="book-card-cover-wrap">
        <img
          src={displaySrc}
          alt={coverAlt}
          className="book-card-cover"
          onError={() => {
            if (fallbackOnce.current) return;
            fallbackOnce.current = true;
            setDisplaySrc(FALLBACK_BOOK_COVER_IMAGE);
          }}
        />
        <button
          type="button"
          className="book-card-wishlist"
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onToggleWishlist === "function") onToggleWishlist();
          }}
        >
          <MaterialIcon
            name={wishlisted ? "favorite" : "favorite_border"}
            className="book-card-wish-icon"
          />
        </button>
      </div>
      <div className="book-card-body">
        <h3 className="book-card-title">{title}</h3>
        <p className="book-card-author">{author}</p>
        {location ? (
          <p className="book-card-location">{location}</p>
        ) : null}
        <p className="book-card-owner">Owner: {owner}</p>
        <StatusBadge status={status} />
      </div>
    </article>
  );
}
