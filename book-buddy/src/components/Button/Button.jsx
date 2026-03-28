import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  onClick,
  disabled = false,
}) {
  const variantClass =
    variant === "terracotta"
      ? "btn btn-terracotta"
      : variant === "ghost"
        ? "btn btn-ghost"
        : "btn btn-primary";

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
