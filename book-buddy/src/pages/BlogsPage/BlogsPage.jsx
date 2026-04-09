import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CreatePostComposer from "./CreatePostComposer.jsx";
import {
  PREVIEW_MAX_CHARS,
  postTag,
  previewPlainContent,
} from "./blogPostShared.jsx";
import "./BlogsPage.css";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";

function since(value) {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function BlogsPage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { ...authHeader() };
      const response = await fetch(`${API}/posts`, { headers });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        if (headers.Authorization) {
          flashSessionExpired();
          logout();
        }
        throw new Error(data.message ?? "Could not load posts");
      }
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.message ?? "Could not load posts");
      }
      setPosts(data);
    } catch (e) {
      setError(e.message ?? "Could not load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    if (!user) setShowComposer(false);
  }, [user]);

  const createPost = async (payload) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? "Could not create post");
      }
      setShowComposer(false);
      await loadPosts();
    } finally {
      setSubmitting(false);
    }
  };

  const ordered = useMemo(
    () =>
      [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts],
  );

  return (
    <div className="blogs-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="blogs-main">
        <section
          className={`blogs-header${showComposer ? " blogs-header--composer" : ""}`}
        >
          <h1>Blogs</h1>
          {user ? (
            showComposer ? (
              <button
                type="button"
                className="blogs-btn blogs-btn-close"
                onClick={() => setShowComposer(false)}
              >
                Close
              </button>
            ) : (
              <button
                type="button"
                className="blogs-btn blogs-btn-primary"
                onClick={() => setShowComposer(true)}
              >
                Create post
              </button>
            )
          ) : (
            <Link
              to="/login?next=/blogs"
              className="blogs-btn blogs-btn-primary blogs-btn-link"
            >
              Log in to post
            </Link>
          )}
        </section>

        {user && showComposer ? (
          <CreatePostComposer submitting={submitting} onSubmit={createPost} />
        ) : null}

        {!(user && showComposer) && loading ? (
          <p className="blogs-hint">Loading posts...</p>
        ) : null}
        {!(user && showComposer) && error ? (
          <p className="blogs-error">{error}</p>
        ) : null}

        {!(user && showComposer) ? (
          <section className="blogs-feed" aria-label="Post feed">
            {ordered.map((post, index) => {
              const id = String(post?._id ?? post?.id ?? "");
              const author = String(post?.authorId?.username ?? "Unknown");
              const { text: previewText, truncated } = previewPlainContent(
                post?.content,
                PREVIEW_MAX_CHARS,
              );
              return (
                <article key={id || `post-${index}`} className="blogs-post">
                  <Link  to={`/blogs/${id}`} className="blogs-post-link">
                  <p className="blogs-post-meta">
                    <strong>{postTag(post)}</strong> · Posted by {author} ·{" "}
                    {since(post.createdAt)}
                  </p>
                  <h2 className="blogs-post-title">
                    <Link to={`/blogs/${id}`} className="blogs-post-title-link">
                      {String(post?.title ?? "")}
                    </Link>
                  </h2>
                  <p className="blogs-post-preview"> {previewText}</p>
                  {truncated ? (
                    <p className="blogs-post-readmore">
                      <Link to={`/blogs/${id}`} className="blogs-readmore-link">
                        Read full post
                      </Link>
                    </p>
                  ) : null}
                  <div className="blogs-post-actions">
                    <Link
                      to={
                        user
                          ? `/blogs/${id}`
                          : `/login?next=${encodeURIComponent(`/blogs/${id}`)}`
                      }
                      className="blogs-link-btn"
                    >
                      <MaterialIcon name="chat_bubble" /> Comments
                    </Link>
                    <button type="button" className="blogs-link-btn">
                      <MaterialIcon name="share" /> Share
                    </button>
                    <button type="button" className="blogs-link-btn">
                      <MaterialIcon name="flag" /> Report
                    </button>
                    <button type="button" className="blogs-link-btn">
                      <MaterialIcon name="arrow_upward" />
                    </button>
                    <button type="button" className="blogs-link-btn">
                      <MaterialIcon name="arrow_downward" />
                    </button>
                  </div>
                  </Link>
                </article>
              );
            })}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
