import "./TextField.css";

export default function TextField({
  id,
  label,
  type = "text",
  name,
  placeholder,
  autoComplete,
  required = false,
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={`text-field ${className}`.trim()}>
      <label className="text-field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        className="text-field-input"
      />
    </div>
  );
}
