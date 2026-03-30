import "./MaterialIcon.css";

export default function MaterialIcon({ name, className = "", label }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
    >
      {name}
    </span>
  );
}
