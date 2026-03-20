import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import AddNewBookForm from "./components/AddNewBook/AddNewBookForm.jsx";
import Register from "./pages/Register/Register.jsx";
import YourLibraryPage from "./pages/YourLibrary/YourLibraryPage.jsx";
import Footer from "./components/Footer/Footer.jsx";
import BookDetails from "./pages/BookDetails/BookDetails.jsx";

function AppContent() {
  const location = useLocation();

  const hideFooterPaths = ["/auth"];

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/add-book" element={<AddNewBookForm />} />
        <Route path="/auth" element={<Register />} />
        <Route path="/library" element={<YourLibraryPage />} />
        <Route path="/book-details" element={<BookDetails />} />
      </Routes>
      
      {!hideFooterPaths.includes(location.pathname) && <Footer />}
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
