import { useEffect, useId, useRef, useState } from "react";
import MaterialIcon from "../MaterialIcon/MaterialIcon.jsx";
import "./AvatarUpload.css";

export default function AvatarUpload({
  value,
  file,
  onChange,
  label = "Profile photo",
}) {
  const inputId = useId();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || "");

  useEffect(() => {
    if (!file) {
      setPreview(value || "");
      return undefined;
    }

    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [file, value]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (typeof onChange === "function") onChange(file);
  };

  return (
    <div className="avatar-upload">
      <button
        type="button"
        className="avatar-upload-trigger"
        aria-label={label}
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="" className="avatar-upload-preview" />
        ) : (
          <MaterialIcon
            name="add_a_photo"
            className="avatar-upload-placeholder-icon"
          />
        )}
      </button>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="avatar-upload-input"
        onChange={handleFile}
      />
      <label htmlFor={inputId} className="avatar-upload-caption">
        {label}
      </label>
    </div>
  );
}
