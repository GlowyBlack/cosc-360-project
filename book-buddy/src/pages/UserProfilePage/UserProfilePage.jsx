import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader } from "../../config/api.js";
import { getSessionUserId } from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../ProfilePage/ProfilePage.css";
import "./UserProfilePage.css";

const PAGE_SIZE = 4;

function formatStatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
}

function formatLocationLine(location) {
  const raw = String(location ?? "").trim();
  if (!raw) return "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ")
    .toUpperCase();
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const sessionId = getSessionUserId(user);

  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState("");

  const idOk = Boolean(userId && /^[a-f\d]{24}$/i.test(String(userId).trim()));

  const isSelf = Boolean(sessionId && userId && sessionId === String(userId).trim());

  const loadProfile = useCallback(async () => {
    if (!idOk) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const response = await fetch(
        `${API}/user/${encodeURIComponent(userId)}/profile`,
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? data.detail ?? "Could not load profile");
      }
      setProfile(data);
    } catch (e) {
      setProfile(null);
      setProfileError(e.message ?? "Could not load profile");
    } finally {
      setProfileLoading(false);
    }
  }, [idOk, userId]);

  const loadBooks = useCallback(async () => {
    if (!idOk) return;
    setBooksLoading(true);
    setBooksError("");
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const response = await fetch(
        `${API}/user/${encodeURIComponent(userId)}/books?${qs.toString()}`,
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? data.detail ?? "Could not load books");
      }
      setBooks(Array.isArray(data.books) ? data.books : []);
      setTotalPages(Number(data.totalPages) || 0);
      setTotalBooks(Number(data.total) || 0);
    } catch (e) {
      setBooks([]);
      setBooksError(e.message ?? "Could not load books");
    } finally {
      setBooksLoading(false);
    }
  }, [idOk, userId, page]);

  const loadFollowState = useCallback(async () => {
    if (!user || !idOk || !sessionId || isSelf) {
      setFollowing(false);
      return;
    }
    try {
      const response = await fetch(
        `${API}/user/${encodeURIComponent(userId)}/is-following`,
        { headers: { ...authHeader() } },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      setFollowing(Boolean(data.data?.isFollowing));
    } catch {
      setFollowing(false);
    }
  }, [user, idOk, userId, sessionId, isSelf]);

  useEffect(() => {
    setPage(1);
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    loadFollowState();
  }, [loadFollowState]);

  const displayName = String(profile?.username ?? "Reader");
  const bioText = String(profile?.bio ?? "").trim();
  const locationLine = formatLocationLine(profile?.location);

  const stats = profile?.stats;

  const onToggleFollow = async () => {
    if (!user || !idOk || isSelf) return;
    setFollowError("");
    setFollowLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const response = await fetch(
        `${API}/user/${encodeURIComponent(userId)}/follow`,
        {
          method,
          headers: { ...authHeader() },
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setFollowError("Please sign in to follow readers.");
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? data.detail ?? "Could not update follow");
      }
      setFollowing(!following);
    } catch (e) {
      setFollowError(e.message ?? "Could not update follow");
    } finally {
      setFollowLoading(false);
    }
  };

  if (!idOk) {
    return (
      <div className="profile-page">
        <Header variant={user ? "user" : "guest"} />
        <main className="profile-main">
          <p className="profile-error">Invalid profile link.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSelf) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="profile-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="profile-main">
        <section className="profile-sheet" aria-label="Reader profile">
          {profileLoading ? (
            <p className="profile-stats-hint">Loading profile…</p>
          ) : profileError ? (
            <p className="profile-error">{profileError}</p>
          ) : profile ? (
            <>
              <div className="profile-sheet-header user-profile-sheet-header">
                <div className="profile-avatar-col">
                  <div className="profile-avatar-static" aria-hidden>
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt=""
                        className="profile-avatar-img"
                      />
                    ) : (
                      <MaterialIcon
                        name="account_circle"
                        className="profile-avatar-icon"
                      />
                    )}
                  </div>
                </div>

                <div className="profile-info-col">
                  <p className="user-profile-kicker">Reader</p>
                  <h1 className="profile-name">{displayName}</h1>
                  {bioText ? (
                    <p className="user-profile-bio">{bioText}</p>
                  ) : (
                    <p className="user-profile-bio user-profile-bio--empty">
                      No bio yet.
                    </p>
                  )}

                  <div className="user-profile-actions">
                    {user && !isSelf ? (
                      <button
                        type="button"
                        className={
                          following
                            ? "profile-btn profile-btn-secondary"
                            : "profile-btn profile-btn-primary"
                        }
                        onClick={onToggleFollow}
                        disabled={followLoading}
                      >
                        {followLoading
                          ? "…"
                          : following
                            ? "Following"
                            : "Follow"}
                      </button>
                    ) : null}
                    {!user ? (
                      <Link className="profile-btn profile-btn-secondary" to="/login">
                        Log in to follow
                      </Link>
                    ) : null}
                  </div>
                  {followError ? (
                    <p className="profile-error">{followError}</p>
                  ) : null}
                </div>
              </div>

              <div className="profile-stats-wrap" aria-label="Reader stats">
                <ul className="profile-stats-grid user-profile-stats-grid">
                  <li className="profile-stat-card">
                    <MaterialIcon
                      name="sync_alt"
                      className="profile-stat-icon"
                      aria-hidden
                    />
                    <p className="profile-stat-value">
                      {formatStatNumber(stats?.booksBorrowed)}
                    </p>
                    <p className="profile-stat-label">Books borrowed</p>
                  </li>
                  <li className="profile-stat-card">
                    <MaterialIcon
                      name="menu_book"
                      className="profile-stat-icon"
                      aria-hidden
                    />
                    <p className="profile-stat-value">
                      {formatStatNumber(stats?.inLibrary)}
                    </p>
                    <p className="profile-stat-label">In library</p>
                  </li>
                  <li className="profile-stat-card">
                    <MaterialIcon
                      name="star"
                      className="profile-stat-icon"
                      aria-hidden
                    />
                    <p className="profile-stat-value">
                      {stats?.rating != null && Number.isFinite(Number(stats.rating))
                        ? Number(stats.rating).toFixed(1)
                        : "—"}
                    </p>
                    <p className="profile-stat-label">Rating</p>
                  </li>
                </ul>
              </div>
            </>
          ) : null}

          <section className="profile-activity user-profile-loans" aria-label="Available for loan">
            <div className="profile-activity-head">
              <div>
                <h2 className="profile-activity-title">Available for Loan</h2>
                <p className="profile-activity-subtitle">
                  Books this reader is currently offering.
                </p>
              </div>
            </div>

            {booksLoading ? (
              <p className="profile-stats-hint">Loading books…</p>
            ) : booksError ? (
              <p className="profile-error profile-stats-error">{booksError}</p>
            ) : books.length < 1 ? (
              <p className="profile-stats-hint">No books available for loan.</p>
            ) : (
              <>
                <ul className="profile-activity-grid user-profile-loan-grid">
                  {books.map((book, i) => {
                    const id = String(book?._id ?? book?.id ?? `book-${i}`);
                    const title = String(book?.bookTitle ?? "Untitled");
                    const author = String(book?.bookAuthor ?? "");
                    const image = String(book?.bookImage ?? "").trim();
                    const condition = String(book?.condition ?? "").trim();
                    return (
                      <li key={id} className="profile-activity-card user-profile-loan-card">
                        <Link
                          to={`/book/${encodeURIComponent(id)}`}
                          className="user-profile-loan-link"
                        >
                          <div className="profile-activity-cover-wrap user-profile-loan-cover-wrap">
                            {image ? (
                              <img
                                src={image}
                                alt={`Cover: ${title}`}
                                className="profile-activity-cover"
                              />
                            ) : (
                              <div className="profile-activity-cover profile-activity-cover--empty">
                                <MaterialIcon
                                  name="menu_book"
                                  className="profile-activity-empty-icon"
                                />
                              </div>
                            )}
                            {condition ? (
                              <span className="user-profile-condition-badge">
                                {condition}
                              </span>
                            ) : null}
                          </div>
                          <p className="profile-activity-book">{title}</p>
                          {author ? (
                            <p className="user-profile-book-author">{author}</p>
                          ) : null}
                          {locationLine ? (
                            <p className="user-profile-book-location">
                              <MaterialIcon
                                name="location_on"
                                className="user-profile-loc-icon"
                                aria-hidden
                              />
                              {locationLine}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {totalBooks > PAGE_SIZE ? (
                  <nav
                    className="user-profile-pagination"
                    aria-label="Available books pagination"
                  >
                    <button
                      type="button"
                      className="user-profile-page-btn"
                      disabled={page <= 1 || booksLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="user-profile-page-indicator">
                      Page {page} of {Math.max(1, totalPages)}
                    </span>
                    <button
                      type="button"
                      className="user-profile-page-btn"
                      disabled={
                        booksLoading || (totalPages > 0 && page >= totalPages)
                      }
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </nav>
                ) : null}
              </>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
