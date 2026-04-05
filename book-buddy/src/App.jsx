import { Routes, Route } from "react-router-dom";
import AddNewBookForm from "./components/AddNewBook/AddNewBookForm.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";
import BookDetails from "./pages/BookDetails/BookDetails.jsx";
import DiscoverPage from "./pages/DiscoverPage/DiscoverPage.jsx";
import AdminUserSearch from "./pages/AdminUserSearch.jsx";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/add-book" element={<AddNewBookForm />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/book-details" element={<BookDetails />} />
        <Route path="/admin/users/search" element={<AdminUserSearch />} />
      </Routes>
    </>
  );
}

export default App;
