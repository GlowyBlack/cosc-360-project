import "./StatusBadge.css";

const modifierByStatus = {
  Available: "status-badge--available",
  Unavailable: "status-badge--unavailable",
  Pending: "status-badge--pending",
  Borrowed: "status-badge--borrowed",
  Returned: "status-badge--returned",
  Declined: "status-badge--declined",
  Exchanged: "status-badge--exchanged",
};

export default function StatusBadge({ status, className = "" }) {
  const mod = modifierByStatus[status] ?? "status-badge--fallback";
  return (
    <span className={`status-badge ${mod} ${className}`.trim()}>{status}</span>
  );
}
