import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import RegisterForm from "../../components/RegisterForm/RegisterForm.jsx";
import "./RegisterPage.css";

export default function RegisterPage() {
  return (
    <div className="register-page">
      <Header variant="guest" />
      <main className="register-page-main">
        <RegisterForm
          loginHref="/login"
          backHref="/"
        />
      </main>
      <Footer year={2026} />
    </div>
  );
}
