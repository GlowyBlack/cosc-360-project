import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../config/api.js";
import TextField from "../TextField/TextField.jsx";
import PasswordField from "../PasswordField/PasswordField.jsx";
import Button from "../Button/Button.jsx";
import DividerWithLabel from "../DividerWithLabel/DividerWithLabel.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./LoginForm.css";

export default function LoginForm({
  signUpHref = "/register",
  backHref = "/",
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email || "").trim(), password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Login failed");
      }
      if (!data.access_token) {
        throw new Error("No access token in response");
      }

      localStorage.setItem("token", data.access_token);
      navigate("/");
    } catch (e) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-form-card">
      <header className="login-form-header">
        <h1 className="login-form-title">Welcome back</h1>
        <p className="login-form-subtitle">Continue your literary journey.</p>
      </header>
      <form className="login-form-form" onSubmit={handleLogin} noValidate>
        {error ? (
          <p className="login-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <TextField
          id="login-email"
          name="email"
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="terracotta"
          type="submit"
          className="login-form-submit"
          disabled={submitting}
        >
          <span className="login-form-submit-inner">
            {submitting ? "Logging in…" : "Log In"}
            <MaterialIcon name="arrow_forward" className="login-form-submit-icon" />
          </span>
        </Button>
      </form>
      <DividerWithLabel />
      <div className="login-form-signup">
        <p className="login-form-signup-text">
          Don&apos;t have an account?{" "}
          <Link className="login-form-signup-link" to={signUpHref}>
            Sign Up
          </Link>
        </p>
      </div>
      <div className="login-form-back">
        <Link to={backHref} className="login-form-back-link">
          <MaterialIcon name="west" className="login-form-back-icon" />
          <span className="login-form-back-text">Back to Browse</span>
        </Link>
      </div>
    </div>
  );
}
