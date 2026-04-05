import { Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import DiscoverPage from "./pages/DiscoverPage/DiscoverPage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";
import AddBookPage from "./pages/AddBookPage/AddBookPage.jsx";
import EditBookPage from "./pages/EditBookPage/EditBookPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage.jsx";
import BookDetailPage from "./pages/BookDetailPage/BookDetailPage.jsx";
import RequestPage from "./pages/RequestPage/RequestPage.jsx";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/library/edit/:bookId" element={<EditBookPage />} />
        <Route path="/add-book" element={<AddBookPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/requests" element={<RequestPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/book/:bookId" element={<BookDetailPage />} />
      </Routes>
    </>
  );
}

export default App;
