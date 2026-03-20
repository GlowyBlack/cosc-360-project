import React from "react";
import PopularCard from "./PopularCard.jsx";

export default function PopularList({ books, limit = 4 }) {
  return (
    <>
    <h2 className="popularHeader">Popular</h2>
    <div className="popularGrid">
      {books.slice(0, limit).map((book, index) => (
        <PopularCard
          key={index}          // unique key for React lists
          title={book.title}
          author={book.author}
          distance={book.distance}
          image={book.image}
        />
      ))}
    </div>
    </>
  );
}