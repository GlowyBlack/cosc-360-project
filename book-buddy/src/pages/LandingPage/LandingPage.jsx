import PopularList from "../../components/PopularCard/PopularList.jsx";
import Header from "../../components/Header/Header.jsx";

function LandingPage() {
  const books = [
    {
      title: "The Three-Body Problem",
      author: "Cixin Liu",
      distance: "1.2km away",
      image:
        "https://m.media-amazon.com/images/I/91DUejN+hAL._AC_UF1000,1000_QL80_.jpg",
    },
    {
      title: "The Way of Kings",
      author: "Brandon Sanderson",
      distance: "2.4km away",
      image:
        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1659905828i/7235533.jpg",
    },
    {
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
      distance: "0.8km away",
      image: "https://m.media-amazon.com/images/I/91HY8gaU8pL.jpg",
    },
    {
      title: "The Fellowship of the Ring",
      author: "J.R.R. Tolkien",
      distance: "3.1km away",
      image:
        "https://m.media-amazon.com/images/I/71Ep7UNeTtL._AC_UF1000,1000_QL80_.jpg",
    },
  ];

  return (
    <>
      <Header />
      <PopularList books={books} />
    </>
  );
}

export default LandingPage;
