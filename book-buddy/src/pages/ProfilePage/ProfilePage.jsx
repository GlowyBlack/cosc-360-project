import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import AvatarUpload from "../../components/AvatarUpload/AvatarUpload.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./ProfilePage.css";

function formatMemberSince(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function ProfilePage() {
  const { user, setSessionUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [photoDraft, setPhotoDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setBioDraft(String(user?.bio ?? ""));
    setPhotoDraft(String(user?.profileImage ?? ""));
  }, [user?.bio, user?.profileImage]);

  const displayName = useMemo(
    () => String(user?.username ?? "Reader"),
    [user?.username],
  );
  const memberSince = useMemo(
    () => formatMemberSince(user?.createdAt),
    [user?.createdAt],
  );

  const hasChanges = isEditing && (
    String(bioDraft).trim() !== String(user?.bio ?? "").trim() ||
    String(photoDraft).trim() !== String(user?.profileImage ?? "").trim()
  );

  const onCancel = () => {
    setBioDraft(String(user?.bio ?? ""));
    setPhotoDraft(String(user?.profileImage ?? ""));
    setErrorText("");
    setIsEditing(false);
  };

  const onSave = async () => {
    if (!isEditing || !hasChanges || saving) return;
    setSaving(true);
    setErrorText("");
    try {
      const response = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          bio: bioDraft,
          profileImage: photoDraft,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? "Could not save profile");
      }
      setSessionUser(data);
      setIsEditing(false);
    } catch (error) {
      setErrorText(error.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="profile-page">
      <Header variant="user" />
      <main className="profile-main">
        <section className="profile-top-card" aria-label="Profile header">
          <div className="profile-avatar-col">
            {isEditing ? (
              <AvatarUpload
                key="editable-avatar"
                value={photoDraft}
                onChange={(next) => {
                  setPhotoDraft(String(next ?? ""));
                }}
                label="Edit photo"
              />
            ) : (
              <div className="profile-avatar-static" aria-label="Profile photo">
                {photoDraft ? (
                  <img src={photoDraft} alt={`${displayName} profile`} className="profile-avatar-img" />
                ) : (
                  <MaterialIcon
                    name="account_circle"
                    className="profile-avatar-icon"
                    label="Default profile icon"
                  />
                )}
              </div>
            )}
          </div>

          <div className="profile-info-col">
            <h1 className="profile-name">{displayName}</h1>
            <p className="profile-member-since">
              {memberSince ? `Member since ${memberSince}` : "Member"}
            </p>

            <label className="profile-bio-label" htmlFor="profile-bio">
              Personal Bio
            </label>
            <textarea
              id="profile-bio"
              className="profile-bio-input"
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              readOnly={!isEditing}
              maxLength={600}
            />

            <div className="profile-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="profile-btn profile-btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="profile-btn profile-btn-primary"
                    onClick={onSave}
                    disabled={!hasChanges || saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="profile-btn profile-btn-secondary"
                    onClick={onCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {errorText ? <p className="profile-error">{errorText}</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
