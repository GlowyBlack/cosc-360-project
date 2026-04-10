import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import { resolveCoverAlt, useBookCoverDisplaySrc } from "../../commons/bookShared.js";
import { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import API from "../../config/api.js";
import "./BookCard.css";

export default function BookCard({
  id,
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
  const { logout } = useAuth();
  const interactive = typeof onClick === "function";
  const rawSrc = typeof cover === "string" ? cover : cover?.src;
  const coverAlt = resolveCoverAlt(cover, rawSrc);
  const { displaySrc, onImgError } = useBookCoverDisplaySrc(rawSrc);

  const toggleWishlist = async () => {
    try {
      const response = await fetch(`${API}/user/wishlist/${id}`, {
        method: "PATCH",
        headers: { ...authHeader() },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }

      if (!response.ok) {
        console.log("wishlist error payload:", data);
        throw new Error(
          data.message ?? data.detail ?? data.error ?? "Could not wishlist"
        );
      }

      if (typeof onToggleWishlist === "function") {
        onToggleWishlist(data.wishlisted);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

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
          onError={onImgError}
        />
        <button
          type="button"
          className={`book-card-wishlist ${
            wishlisted ? "book-card-wishlist--active" : ""
          }`.trim()}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist();
          }}
        >
          <MaterialIcon
            name={wishlisted ? "bookmark_star" : "bookmark"}
            className="book-card-wish-icon"
          />
        </button>
      </div>
      <div className="book-card-body">
        <h3 className="book-card-title">{title}</h3>
        <p className="book-card-author">{author}</p>
        {location ? <p className="book-card-location">{location}</p> : null}
        <p className="book-card-owner">Owner: {owner}</p>
        <StatusBadge status={status} />
      </div>
    </article>
  );
}
