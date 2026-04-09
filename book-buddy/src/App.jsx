import { Routes, Route } from "react-router-dom";
import AddBookPage from "./pages/AddBookPage/AddBookPage.jsx";
import AdminLayout from "./pages/AdminLayout/AdminLayout.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage/AdminDashboardPage.jsx";
import AdminListingsPage from "./pages/admin/AdminListingsPage/AdminListingsPage.jsx";
import AdminCommentsPage from "./pages/admin/AdminCommentsPage/AdminCommentsPage.jsx";
import AdminPostsPage from "./pages/admin/AdminPostsPage/AdminPostsPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage/AdminUsersPage.jsx";
import BlogsPage from "./pages/BlogsPage/BlogsPage.jsx";
import BlogPostPage from "./pages/BlogsPage/BlogPostPage.jsx";
import BookDetailPage from "./pages/BookDetailPage/BookDetailPage.jsx";
import DiscoverPage from "./pages/DiscoverPage/DiscoverPage.jsx";
import EditBookPage from "./pages/EditBookPage/EditBookPage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import MessagesPage from "./pages/MessagesPage/MessagesPage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import RequestPage from "./pages/RequestPage/RequestPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage.jsx";

function AppContent() {
 
  return (
    <>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/add-book" element={<AddBookPage />} />
        <Route path="/blogs/:postId" element={<BlogPostPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/book/:bookId" element={<BookDetailPage />} />
        <Route path="/library/edit/:bookId" element={<EditBookPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/requests" element={<RequestPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
