import './PopularCard.css'

const FALLBACK_IMAGE =
  "https://cdn.vectorstock.com/i/1000v/32/45/no-image-symbol-missing-available-icon-gallery-vector-45703245.jpg";

function PopularCard({ title, author, distance, image}) {
  return (
    <div className="popular-card">
      <img
        className="popular-card-image"
        src={image || FALLBACK_IMAGE}
        alt="Book cover"
        onError={(e) => {
          const el = e.currentTarget;
          if (!el.dataset.usedFallback) {
            el.dataset.usedFallback = "1";
            el.src = FALLBACK_IMAGE;
          }
        }}
      />

      <div className="popular-card-info">
        <h3>{title}</h3>
        <p className="author">{author}</p>
        {distance && (
          <p className="distance">
            <img
              src="https://www.iconpacks.net/icons/1/free-pin-icon-48-thumb.png"
              alt="Distance: "
              className="pin-icon"
            />
            {distance + " km away"}
          </p>
        )}
      </div>
    </div>
  )
}

export default PopularCard