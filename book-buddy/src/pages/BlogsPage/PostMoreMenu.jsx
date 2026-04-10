import { useEffect, useRef, useState } from "react";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";

export default function PostMoreMenu({ isOwner, onEdit, onDelete, disabled = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  if (!isOwner) return null;

  return (
    <div className="blogs-post-more" ref={wrapRef}>
      <button
        type="button"
        className="blogs-post-more-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Post options"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <MaterialIcon name="more_vert" />
      </button>
      {open ? (
        <ul className="blogs-post-more-menu" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="blogs-post-more-item"
              onClick={() => {
                setOpen(false);
                onEdit?.();
              }}
            >
              Edit post
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="blogs-post-more-item blogs-post-more-item--danger"
              onClick={() => {
                setOpen(false);
                onDelete?.();
              }}
            >
              Delete post
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
