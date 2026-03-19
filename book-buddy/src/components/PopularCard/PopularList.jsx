import React from "react";
import PopularCard from "./PopularCard.jsx";

export default function PopularList({ books }) {
  return (
    <div className="popular-list">
      {books.slice(0, 4).map((book, index) => (
        <PopularCard
          key={index}          // unique key for React lists
          title={book.title}
          author={book.author}
          distance={book.distance}
          image={book.image}
        />
      ))}
    </div>
  );
}