import { Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import DiscoverPage from "./pages/DiscoverPage/DiscoverPage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";
import AddBookPage from "./pages/AddBookPage/AddBookPage.jsx";
import EditBookPage from "./pages/EditBookPage/EditBookPage.jsx";
import BookDetails from "./pages/BookDetails/BookDetails.jsx";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/add-book" element={<AddBookPage />} />
        <Route path="/library/edit/:bookId" element={<EditBookPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/book-details" element={<BookDetails />} />
      </Routes>
    </>
  );
}

export default App;