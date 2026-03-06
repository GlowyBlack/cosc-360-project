import { useState } from 'react'
import './PopularCard.css'

function PopularCard({ title, author, distance, image}) {
  return (
    <div className="popular-card">
      <img
        className="popular-card-image"
        src={image}
        alt="Book cover"
      />

      <div className="popular-card-info">
        <h3>{title}</h3>
        <p className="author">{author}</p>
        <p className="distance">
            <img
                src="https://www.iconpacks.net/icons/1/free-pin-icon-48-thumb.png"
                alt="Distance: "
                className="pin-icon"
            />
            {distance}
        </p>
      </div>
    </div>
  )
}

export default PopularCard


