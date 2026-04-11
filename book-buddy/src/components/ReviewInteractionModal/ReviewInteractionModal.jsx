import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./ReviewInteractionModal.css";

export default function ReviewInteractionModal({
  open,
  onClose,
  requestId,
  interactionLabel,
  onSubmitted,
}) {
  const titleId = useId();
  const { logout } = useAuth();
  const [eligibility, setEligibility] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !requestId) return undefined;
    setEligibility(null);
    setLoadError("");
    setRating(0);
    setComment("");
    setSubmitError("");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API}/reviews/eligibility/${encodeURIComponent(requestId)}`,
          { headers: { ...authHeader() } },
        );
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!res.ok) {
          throw new Error(data.message ?? "Could not check review eligibility");
        }
        if (!cancelled) setEligibility(data);
      } catch (e) {
        if (!cancelled) setLoadError(e.message ?? "Could not load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, requestId, logout]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function submit() {
    if (!requestId || rating < 1 || busy) return;
    setBusy(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          requestId,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!res.ok) {
        throw new Error(data.message ?? "Could not submit review");
      }
      onSubmitted?.();
      onClose();
    } catch (e) {
      setSubmitError(e.message ?? "Could not submit review");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !requestId) return null;

  const eligible = eligibility?.eligible === true;
  const reason = eligibility?.reason;
  let blockedMessage = "";
  if (eligibility && !eligible) {
    if (reason === "already_reviewed") {
      blockedMessage = "You already rated this interaction.";
    } else if (reason === "request_not_reviewable") {
      blockedMessage =
        "Reviews are available only after the lender marks the book returned, or once an exchange is accepted. Pending and declined requests cannot be reviewed.";
    } else if (reason === "not_participant") {
      blockedMessage = "You are not part of this request.";
    } else if (reason === "request_not_found") {
      blockedMessage = "This request was not found.";
    } else {
      blockedMessage = "You cannot leave a review for this request.";
    }
  }

  const portal = (
    <div
      className="review-interaction-backdrop"
      role="presentation"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="review-interaction-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="review-interaction-header">
          <div>
            <h2 id={titleId} className="review-interaction-title">
              Rate your interaction
            </h2>
            {interactionLabel ? (
              <p className="review-interaction-sub">How was your interaction with {interactionLabel}?</p>
            ) : (
              <p className="review-interaction-sub">How was your interaction?</p>
            )}
          </div>
          <button
            type="button"
            className="review-interaction-close"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </header>

        <div className="review-interaction-body">
          {loadError ? (
            <p className="review-interaction-error" role="alert">
              {loadError}
            </p>
          ) : null}
          {!loadError && eligibility && !eligible ? (
            <p className="review-interaction-sub" role="status">
              {blockedMessage}
            </p>
          ) : null}
          {!loadError && eligible ? (
            <>
              <div className="review-interaction-stars" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`review-interaction-star${rating >= n ? " review-interaction-star--on" : ""}`.trim()}
                    aria-pressed={rating >= n}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    disabled={busy}
                    onClick={() => setRating(n)}
                  >
                    <MaterialIcon name="star" />
                  </button>
                ))}
              </div>
              <label className="review-interaction-label" htmlFor={`${titleId}-note`}>
                Comment (optional)
              </label>
              <textarea
                id={`${titleId}-note`}
                className="review-interaction-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything others should know?"
                disabled={busy}
                maxLength={2000}
              />
              {submitError ? (
                <p className="review-interaction-error" role="alert">
                  {submitError}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="review-interaction-actions">
          <button
            type="button"
            className="blogs-btn blogs-btn-close"
            disabled={busy}
            onClick={onClose}
          >
            Close
          </button>
          {eligible ? (
            <button
              type="button"
              className="blogs-btn blogs-btn-primary"
              disabled={busy || rating < 1}
              onClick={() => void submit()}
            >
              {busy ? "Sending…" : "Submit review"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}
