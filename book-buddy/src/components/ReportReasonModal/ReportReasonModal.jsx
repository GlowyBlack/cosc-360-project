import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./ReportReasonModal.css";

export default function ReportReasonModal({
  open,
  onClose,
  targetType,
  targetId,
  subjectHint,
  onSuccess,
}) {
  const titleId = useId();
  const { logout } = useAuth();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setReason("");
    setError("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, targetType, targetId]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function handleSubmit() {
    const tid = String(targetId ?? "").trim();
    if (!tid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          targetType,
          targetId: tid,
          reason: String(reason ?? "").trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!res.ok) {
        throw new Error(data.message ?? "Could not submit report");
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message ?? "Could not submit report");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !targetType || !targetId) return null;

  const portal = (
    <div
      className="report-modal-backdrop"
      role="presentation"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="report-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="report-modal-header">
          <div>
            <h2 id={titleId} className="report-modal-title">
              Report {targetType === "Post" ? "post" : "comment"}
            </h2>
            {subjectHint ? (
              <p className="report-modal-subtitle">{subjectHint}</p>
            ) : (
              <p className="report-modal-subtitle">
                Moderators will review this report. You can add an optional note
                below.
              </p>
            )}
          </div>
          <button
            type="button"
            className="report-modal-close"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </header>
        <div className="report-modal-body">
          <label className="report-modal-label" htmlFor={`${titleId}-reason`}>
            Details (optional)
          </label>
          <textarea
            id={`${titleId}-reason`}
            className="report-modal-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What should moderators know? (optional)"
            maxLength={2000}
            disabled={busy}
          />
          {error ? (
            <p className="report-modal-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="report-modal-actions">
          <button
            type="button"
            className="blogs-btn blogs-btn-close"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="blogs-btn blogs-btn-primary"
            disabled={busy}
            onClick={() => void handleSubmit()}
          >
            {busy ? "Sending…" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}
