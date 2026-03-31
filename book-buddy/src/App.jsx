import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddNewBookForm from "./components/AddNewBook/AddNewBookForm.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
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
        <Route path="/register" element={<RegisterPage />} />
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
