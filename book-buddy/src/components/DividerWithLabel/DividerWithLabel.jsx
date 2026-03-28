import "./DividerWithLabel.css";

export default function DividerWithLabel({ label = "OR" }) {
  return (
    <div className="divider-with-label" role="separator" aria-label={label}>
      <div className="divider-with-label-line" />
      <span className="divider-with-label-text">{label}</span>
      <div className="divider-with-label-line" />
    </div>
  );
}
