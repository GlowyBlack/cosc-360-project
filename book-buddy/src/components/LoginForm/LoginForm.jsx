import { useState } from "react";
import { Link } from "react-router-dom";
import TextField from "../TextField/TextField.jsx";
import PasswordField from "../PasswordField/PasswordField.jsx";
import Button from "../Button/Button.jsx";
import DividerWithLabel from "../DividerWithLabel/DividerWithLabel.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./LoginForm.css";

export default function LoginForm({
  onSubmit,
  isSubmitting = false,
  error = "",
  signUpHref = "/register",
  backHref = "/",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === "function") {
      onSubmit({ email, password });
    }
  };

  return (
    <div className="login-form-card">
      <header className="login-form-header">
        <h1 className="login-form-title">Welcome back</h1>
        <p className="login-form-subtitle">Continue your literary journey.</p>
      </header>
      <form className="login-form-form" onSubmit={handleSubmit} noValidate>
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
          disabled={isSubmitting}
        >
          <span className="login-form-submit-inner">
            {isSubmitting ? "Logging in…" : "Log In"}
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
