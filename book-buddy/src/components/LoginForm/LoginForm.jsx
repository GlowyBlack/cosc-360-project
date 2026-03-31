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
  isSubmitting = false,
  error = "",
  signUpHref = "/register",
  backHref = "/",
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [internalError, setInternalError] = useState("");
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {

      navigate("/");
    } catch (err) {
      setError(err.message ?? "Something went wrong");
    } finally {
      
    }
  };

  const displayError = error || internalError;
  const submitting = isSubmitting || internalSubmitting;

  return (
    <div className="login-form-card">
      <header className="login-form-header">
        <h1 className="login-form-title">Welcome back</h1>
        <p className="login-form-subtitle">Continue your literary journey.</p>
      </header>
      <form className="login-form-form" onSubmit={handleSubmit} noValidate>
        {displayError ? (
          <p className="login-form-error" role="alert">
            {displayError}
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
