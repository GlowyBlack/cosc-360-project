import "./LibraryBookCard.css";

const FALLBACK_IMAGE =
  "https://cdn.vectorstock.com/i/1000v/32/45/no-image-symbol-missing-available-icon-gallery-vector-45703245.jpg";

function LibraryBookCard({ title, author, availability, image, showEdit = false }) {
  return (
    <article className="library-book-card">
      <div className="library-book-card-image-wrap">
        <img
          className="library-book-card-image"
          src={image || FALLBACK_IMAGE}
          alt={`${title} cover`}
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.dataset.usedFallback) {
              el.dataset.usedFallback = "1";
              el.src = FALLBACK_IMAGE;
            }
          }}
        />
      </div>

      <div className="library-book-card-info">
        <h3>{title}</h3>
        <p>{author}</p>
        <p className="library-book-card-availability">{availability}</p>
      </div>

      {showEdit && (
        <button type="button" className="library-book-card-edit-btn">
          Edit
        </button>
      )}
    </article>
  );
}

export default LibraryBookCard;
