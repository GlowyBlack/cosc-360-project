import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
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

function formatStatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
}

function relativeListedAt(value) {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "Listed recently";
  const diff = Date.now() - t;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / dayMs);
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed 1 day ago";
  return `Listed ${days} days ago`;
}

export default function ProfilePage() {
  const { user, setSessionUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [photoDraft, setPhotoDraft] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [activityBooks, setActivityBooks] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    setBioDraft(String(user?.bio ?? ""));
    setPhotoDraft(String(user?.profileImage ?? ""));
    setPhotoFile(null);
  }, [user?.bio, user?.profileImage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const response = await fetch(`${API}/auth/me/stats`, {
          headers: { ...authHeader() },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(data.detail ?? data.message ?? "Could not load stats");
        }
        if (!cancelled) {
          setStats({
            booksListed: data.booksListed ?? 0,
            exchangesCompleted: data.exchangesCompleted ?? 0,
            booksBorrowed: data.booksBorrowed ?? 0,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setStats(null);
          setStatsError(e.message ?? "Could not load stats");
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setActivityLoading(true);
      setActivityError("");
      try {
        const response = await fetch(`${API}/books/me`, {
          headers: { ...authHeader() },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(data.message ?? data.detail ?? "Could not load shelf activity");
        }

        const rows = Array.isArray(data) ? data : [];
        const sorted = [...rows].sort((a, b) => {
          const at = new Date(a?.updatedAt ?? a?.createdAt ?? 0).getTime();
          const bt = new Date(b?.updatedAt ?? b?.createdAt ?? 0).getTime();
          return bt - at;
        });
        if (!cancelled) {
          setActivityBooks(sorted.slice(0, 6));
        }
      } catch (e) {
        if (!cancelled) {
          setActivityBooks([]);
          setActivityError(e.message ?? "Could not load shelf activity");
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

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
    String(photoDraft).trim() !== String(user?.profileImage ?? "").trim() ||
    Boolean(photoFile)
  );

  const onCancel = () => {
    setBioDraft(String(user?.bio ?? ""));
    setPhotoDraft(String(user?.profileImage ?? ""));
    setPhotoFile(null);
    setErrorText("");
    setIsEditing(false);
  };

  const onSave = async () => {
    if (!isEditing || !hasChanges || saving) return;
    setSaving(true);
    setErrorText("");
    try {
      let nextUser = user;
      let nextImage = String(photoDraft).trim();

      if (photoFile) {
        const formData = new FormData();
        formData.append("image", photoFile);

        const uploadResponse = await fetch(`${API}/auth/me/image`, {
          method: "POST",
          headers: {
            ...authHeader(),
          },
          body: formData,
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (uploadResponse.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!uploadResponse.ok) {
          throw new Error(uploadData.detail ?? uploadData.message ?? "Could not upload profile image");
        }

        nextImage = String(uploadData.profileImage ?? uploadData.user?.profileImage ?? "").trim();
        nextUser = uploadData.user ?? nextUser;
      }

      const shouldPatchProfile =
        String(bioDraft).trim() !== String(nextUser?.bio ?? "").trim() ||
        String(photoDraft).trim() !== String(nextImage).trim();

      if (shouldPatchProfile) {
        const response = await fetch(`${API}/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({
            bio: bioDraft,
            profileImage: nextImage,
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
        nextUser = data;
      }

      setPhotoDraft(nextImage);
      setPhotoFile(null);
      setSessionUser(nextUser);
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
        <section className="profile-sheet" aria-label="My profile">
          <div className="profile-sheet-header">
            <div className="profile-avatar-col">
              {isEditing ? (
                <AvatarUpload
                  key="editable-avatar"
                  value={photoDraft}
                  file={photoFile}
                  onChange={(nextFile) => {
                    setPhotoFile(nextFile ?? null);
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
          </div>

          <div className="profile-stats-wrap" aria-label="Your activity">
            {statsLoading ? (
              <p className="profile-stats-hint">Loading stats…</p>
            ) : statsError ? (
              <p className="profile-error profile-stats-error">{statsError}</p>
            ) : (
              <ul className="profile-stats-grid">
                <li className="profile-stat-card">
                  <MaterialIcon name="menu_book" className="profile-stat-icon" aria-hidden />
                  <p className="profile-stat-value">{formatStatNumber(stats?.booksListed)}</p>
                  <p className="profile-stat-label">Books listed</p>
                </li>
                <li className="profile-stat-card">
                  <MaterialIcon name="sync_alt" className="profile-stat-icon" aria-hidden />
                  <p className="profile-stat-value">{formatStatNumber(stats?.exchangesCompleted)}</p>
                  <p className="profile-stat-label">Exchanges completed</p>
                </li>
                <li className="profile-stat-card">
                  <MaterialIcon name="assignment" className="profile-stat-icon" aria-hidden />
                  <p className="profile-stat-value">{formatStatNumber(stats?.booksBorrowed)}</p>
                  <p className="profile-stat-label">Books borrowed</p>
                </li>
              </ul>
            )}
          </div>

          <section className="profile-activity" aria-label="Shelf activity">
            <div className="profile-activity-head">
              <div>
                <h2 className="profile-activity-title">Shelf Activity</h2>
                <p className="profile-activity-subtitle">Your most recent contributions and requests.</p>
              </div>
              <Link to="/library" className="profile-activity-link">
                View library
              </Link>
            </div>

            {activityLoading ? (
              <p className="profile-stats-hint">Loading shelf activity…</p>
            ) : activityError ? (
              <p className="profile-error profile-stats-error">{activityError}</p>
            ) : activityBooks.length < 1 ? (
              <p className="profile-stats-hint">No shelf activity yet.</p>
            ) : (
              <ul className="profile-activity-grid">
                {activityBooks.map((book, i) => {
                  const id = String(book?._id ?? book?.id ?? `book-${i}`);
                  const title = String(book?.bookTitle ?? "Untitled");
                  const image = String(book?.bookImage ?? "").trim();
                  return (
                    <li key={id} className="profile-activity-card">
                      <div className="profile-activity-cover-wrap">
                        {image ? (
                          <img src={image} alt={`Cover: ${title}`} className="profile-activity-cover" />
                        ) : (
                          <div className="profile-activity-cover profile-activity-cover--empty">
                            <MaterialIcon name="menu_book" className="profile-activity-empty-icon" />
                          </div>
                        )}
                      </div>
                      <p className="profile-activity-book">{title}</p>
                      <p className="profile-activity-meta">{relativeListedAt(book?.createdAt)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
