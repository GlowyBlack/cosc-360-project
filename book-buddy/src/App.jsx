import { Routes, Route } from "react-router-dom";
import AddBookPage from "./pages/AddBookPage/AddBookPage.jsx";
import AdminLayout from "./pages/AdminLayout/AdminLayout.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import BlogsPage from "./pages/BlogsPage/BlogsPage.jsx";
import BookDetailPage from "./pages/BookDetailPage/BookDetailPage.jsx";
import DiscoverPage from "./pages/DiscoverPage/DiscoverPage.jsx";
import EditBookPage from "./pages/EditBookPage/EditBookPage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import MessagesPage from "./pages/MessagesPage/MessagesPage.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import RequestPage from "./pages/RequestPage/RequestPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage.jsx";


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
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
