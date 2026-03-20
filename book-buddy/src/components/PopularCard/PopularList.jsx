import React from "react";
import PopularCard from "./PopularCard.jsx";

export default function PopularList({ books }) {
  return (
    <>
    <h2 className="popularHeader">Popular</h2>
    <div className="popularGrid">
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
    </>
  );
}