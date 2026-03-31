import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import LoginForm from "../../components/LoginForm/LoginForm.jsx";
import "./LoginPage.css";

export default function LoginPage() {
  return (
    <div className="login-page">
      <Header variant="guest" />
      <main className="login-page-main">
        <LoginForm
          signUpHref="/register"
          backHref="/"
        />
      </main>
      <Footer year={2026} />
    </div>
  );
}
