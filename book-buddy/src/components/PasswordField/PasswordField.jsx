import { useId, useState } from "react";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./PasswordField.css";

export default function PasswordField({
  label,
  name = "password",
  placeholder = "••••••••",
  forgotHref = "#",
  forgotLabel = "Forgot?",
  showForgotLink = true,
  autoComplete = "current-password",
  required = true,
  value,
  onChange,
  className = "",
}) {
  const baseId = useId();
  const inputId = `${baseId}-password`;
  const [show, setShow] = useState(false);

  return (
    <div className={`password-field ${className}`.trim()}>
      <div className="password-field-row">
        <label className="password-field-label" htmlFor={inputId}>
          {label}
        </label>
        {showForgotLink && (
          <a className="password-field-forgot" href={forgotHref}>
            {forgotLabel}
          </a>
        )}
      </div>
      <div className="password-field-inner">
        <input
          id={inputId}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          className="password-field-input"
        />
        <button
          type="button"
          className="password-field-toggle"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <MaterialIcon
            name={show ? "visibility_off" : "visibility"}
            className="password-field-toggle-icon"
          />
        </button>
      </div>
    </div>
  );
}
