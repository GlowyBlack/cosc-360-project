import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddNewBookForm from "./components/AddNewBook/AddNewBookForm.jsx";
import Register from "./pages/Register/Register.jsx";
import LoginPage from "./pages/Login/LoginPage.jsx";
import YourLibraryPage from "./pages/YourLibrary/YourLibraryPage.jsx";
import BookDetails from "./pages/BookDetails/BookDetails.jsx";
import DiscoverPage from "./pages/DiscoverPage/DiscoverPage.jsx";

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        {/* <Route path="/discover" element={<Navigate to="/" replace />} /> */}
        <Route path="/add-book" element={<AddNewBookForm />} />
        <Route path="/auth" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/library" element={<YourLibraryPage />} />
        <Route path="/book-details" element={<BookDetails />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
