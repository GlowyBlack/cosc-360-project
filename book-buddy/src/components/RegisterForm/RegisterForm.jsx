import { useState } from "react";
import { Link } from "react-router-dom";
import TextField from "../TextField/TextField.jsx";
import PasswordField from "../PasswordField/PasswordField.jsx";
import Button from "../Button/Button.jsx";
import DividerWithLabel from "../DividerWithLabel/DividerWithLabel.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./RegisterForm.css";

export default function RegisterForm({
  isSubmitting = false,
  error = "",
  loginHref = "/login",
  backHref = "/",
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {

  };

  return (
    <div className="register-form-card">
      <header className="register-form-header">
        <h1 className="register-form-title">Create your account</h1>
        <p className="register-form-subtitle">
          Start swapping stories with fellow readers.
        </p>
      </header>
      <form className="register-form-form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="register-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <TextField
          id="register-first-name"
          name="firstName"
          label="First Name"
          type="text"
          placeholder="John"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          id="register-last-name"
          name="lastName"
          label="Last Name"
          type="text"
          placeholder="Doe"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
          id="register-email"
          name="email"
          label="Email Address"
          type="email"
          placeholder="john.doe@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          showForgotLink={false}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="terracotta"
          type="submit"
          className="register-form-submit"
          disabled={isSubmitting}
        >
          <span className="register-form-submit-inner">
            {isSubmitting ? "Creating…" : "Create account"}
            <MaterialIcon
              name="arrow_forward"
              className="register-form-submit-icon"
            />
          </span>
        </Button>
      </form>
      <DividerWithLabel />
      <div className="register-form-login">
        <p className="register-form-login-text">
          Already have an account?{" "}
          <Link className="register-form-login-link" to={loginHref}>
            Log in
          </Link>
        </p>
      </div>
      <div className="register-form-back">
        <Link to={backHref} className="register-form-back-link">
          <MaterialIcon name="west" className="register-form-back-icon" />
          <span className="register-form-back-text">Back to Browse</span>
        </Link>
      </div>
    </div>
  );
}
