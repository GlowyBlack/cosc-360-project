import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import AvatarUpload from "../../components/AvatarUpload/AvatarUpload.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getSessionUserId } from "../../commons/bookShared.js";
import { postTag, previewPlainContent } from "../BlogsPage/blogPostShared.jsx";
import "./ProfilePage.css";

const PROFILE_COMMENT_PAGE_SIZE = 5;

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

function sincePost(value) {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
  const [recentBlogPost, setRecentBlogPost] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [commentHistory, setCommentHistory] = useState([]);
  const [commentHistoryLoading, setCommentHistoryLoading] = useState(true);
  const [commentHistoryLoadingMore, setCommentHistoryLoadingMore] = useState(false);
  const [commentHistoryHasMore, setCommentHistoryHasMore] = useState(false);
  const [commentHistoryError, setCommentHistoryError] = useState("");

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
        const headers = { ...authHeader() };
        const sessionId = getSessionUserId(user);
        const booksPromise = fetch(`${API}/books/me`, { headers });
        const postsPromise =
          sessionId.length > 0
            ? fetch(`${API}/posts/user/${encodeURIComponent(sessionId)}`, { headers })
            : Promise.resolve(null);

        const [booksRes, postsRes] = await Promise.all([booksPromise, postsPromise]);

        const data = await booksRes.json().catch(() => ({}));
        if (booksRes.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!booksRes.ok) {
          throw new Error(data.message ?? data.detail ?? "Could not load shelf activity");
        }

        const rows = Array.isArray(data) ? data : [];
        const sorted = [...rows].sort((a, b) => {
          const at = new Date(a?.updatedAt ?? a?.createdAt ?? 0).getTime();
          const bt = new Date(b?.updatedAt ?? b?.createdAt ?? 0).getTime();
          return bt - at;
        });

        let latestPost = null;
        if (postsRes) {
          const postsData = await postsRes.json().catch(() => []);
          if (postsRes.ok && Array.isArray(postsData) && postsData.length > 0) {
            latestPost = postsData[0];
          }
        }

        if (!cancelled) {
          setActivityBooks(sorted.slice(0, 6));
          setRecentBlogPost(latestPost);
        }
      } catch (e) {
        if (!cancelled) {
          setActivityBooks([]);
          setRecentBlogPost(null);
          setActivityError(e.message ?? "Could not load shelf activity");
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCommentHistory([]);
      setCommentHistoryHasMore(false);
      setCommentHistoryError("");
      setCommentHistoryLoading(true);
      try {
        const response = await fetch(
          `${API}/comments/me?limit=${PROFILE_COMMENT_PAGE_SIZE}&skip=0`,
          { headers: { ...authHeader() } },
        );
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          flashSessionExpired();
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(data.message ?? "Could not load comment history");
        }
        if (!cancelled) {
          setCommentHistory(Array.isArray(data.comments) ? data.comments : []);
          setCommentHistoryHasMore(Boolean(data.hasMore));
        }
      } catch (e) {
        if (!cancelled) {
          setCommentHistory([]);
          setCommentHistoryHasMore(false);
          setCommentHistoryError(e.message ?? "Could not load comment history");
        }
      } finally {
        if (!cancelled) setCommentHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout, user]);

  const loadMoreComments = async () => {
    if (commentHistoryLoadingMore || !commentHistoryHasMore) return;
    setCommentHistoryLoadingMore(true);
    setCommentHistoryError("");
    try {
      const skip = commentHistory.length;
      const response = await fetch(
        `${API}/comments/me?limit=${PROFILE_COMMENT_PAGE_SIZE}&skip=${skip}`,
        { headers: { ...authHeader() } },
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? "Could not load more comments");
      }
      const next = Array.isArray(data.comments) ? data.comments : [];
      setCommentHistory((prev) => [...prev, ...next]);
      setCommentHistoryHasMore(Boolean(data.hasMore));
    } catch (e) {
      setCommentHistoryError(e.message ?? "Could not load more comments");
    } finally {
      setCommentHistoryLoadingMore(false);
    }
  };

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
                <p className="profile-activity-subtitle">
                  Your latest blog post, recent listings, and requests.
                </p>
              </div>
              <div className="profile-activity-head-actions">
                <Link to="/blogs" className="profile-activity-link">
                  View blogs
                </Link>
                <Link to="/library" className="profile-activity-link">
                  View library
                </Link>
              </div>
            </div>

            {activityLoading ? (
              <p className="profile-stats-hint">Loading shelf activity…</p>
            ) : activityError ? (
              <p className="profile-error profile-stats-error">{activityError}</p>
            ) : null}

            {!activityLoading && !activityError && recentBlogPost ? (
              <div className="profile-activity-blog">
                <p className="profile-activity-blog-label">Latest blog post</p>
                <Link
                  to={`/blogs/${encodeURIComponent(
                    String(recentBlogPost._id ?? recentBlogPost.id ?? ""),
                  )}`}
                  className="profile-activity-blog-card"
                >
                  <span className="profile-activity-blog-icon" aria-hidden>
                    <MaterialIcon name="article" />
                  </span>
                  <div className="profile-activity-blog-text">
                    <p className="profile-activity-blog-title">
                      {String(recentBlogPost.title ?? "Untitled")}
                    </p>
                    <p className="profile-activity-blog-tag">{postTag(recentBlogPost)}</p>
                    <p className="profile-activity-blog-preview">
                      {previewPlainContent(recentBlogPost.content, 140).text}
                    </p>
                    <p className="profile-activity-meta profile-activity-blog-time">
                      Posted {sincePost(recentBlogPost.createdAt)}
                    </p>
                  </div>
                  <MaterialIcon
                    name="chevron_right"
                    className="profile-activity-blog-chevron"
                    aria-hidden
                  />
                </Link>
              </div>
            ) : null}

            {!activityLoading && !activityError && activityBooks.length < 1 && !recentBlogPost ? (
              <p className="profile-stats-hint">No shelf activity yet.</p>
            ) : null}

            {!activityLoading && !activityError && activityBooks.length > 0 ? (
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
            ) : null}
          </section>

          <section className="profile-comment-history" aria-label="Comment history">
            <div className="profile-activity-head">
              <div>
                <h2 className="profile-activity-title">Comment History</h2>
                <p className="profile-activity-subtitle">
                  Your comments on blog posts, newest first. Load more to see older ones.
                </p>
              </div>
              <div className="profile-activity-head-actions">
                <Link to="/blogs" className="profile-activity-link">
                  Go to blogs
                </Link>
              </div>
            </div>

            {commentHistoryLoading ? (
              <p className="profile-stats-hint">Loading comment history…</p>
            ) : commentHistoryError ? (
              <p className="profile-error profile-stats-error">{commentHistoryError}</p>
            ) : commentHistory.length < 1 ? (
              <p className="profile-stats-hint">
                You have not commented on any posts yet.{" "}
                <Link to="/blogs">Browse blogs</Link> to join a discussion.
              </p>
            ) : (
              <>
                <ul className="profile-comment-history-list">
                  {commentHistory.map((row, i) => {
                    const cid = String(row?._id ?? row?.id ?? `c-${i}`);
                    const postRef = row?.postId;
                    const postId =
                      postRef && typeof postRef === "object"
                        ? String(postRef._id ?? postRef.id ?? "")
                        : String(postRef ?? "");
                    const postTitle =
                      postRef && typeof postRef === "object"
                        ? String(postRef.title ?? "Blog post")
                        : "Blog post";
                    const postRemoved =
                      postRef && typeof postRef === "object" && Boolean(postRef.isRemoved);
                    const isReply = Boolean(row?.parentId);
                    return (
                      <li key={cid} className="profile-comment-history-item">
                        <div className="profile-comment-history-item-head">
                          {postId ? (
                            <Link
                              to={`/blogs/${encodeURIComponent(postId)}`}
                              className="profile-comment-history-post-link"
                            >
                              {postRemoved ? `${postTitle} (removed)` : postTitle}
                            </Link>
                          ) : (
                            <span className="profile-comment-history-post-link profile-comment-history-post-link--muted">
                              Post no longer available
                            </span>
                          )}
                          {isReply ? (
                            <span className="profile-comment-history-badge">Reply</span>
                          ) : null}
                        </div>
                        <p className="profile-comment-history-body">
                          {String(row?.content ?? "")}
                        </p>
                        <p className="profile-comment-history-meta">
                          {sincePost(row?.createdAt)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                {commentHistoryHasMore ? (
                  <div className="profile-comment-history-more">
                    <button
                      type="button"
                      className="profile-btn profile-btn-secondary profile-comment-history-more-btn"
                      onClick={() => void loadMoreComments()}
                      disabled={commentHistoryLoadingMore}
                    >
                      {commentHistoryLoadingMore ? "Loading…" : "Load more comments"}
                    </button>
                  </div>
                ) : commentHistory.length > 0 ? (
                  <p className="profile-stats-hint profile-comment-history-end">
                    You have reached the end of your comment history.
                  </p>
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
