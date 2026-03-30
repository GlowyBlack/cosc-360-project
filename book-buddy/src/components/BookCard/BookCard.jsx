import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
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
        <img src={cover.src} alt={cover.alt} className="book-card-cover" />
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