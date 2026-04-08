import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CreatePostComposer from "./CreatePostComposer.jsx";
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

function postTag(post) {
  const title = String(post?.bookTag?.title ?? "").trim();
  const author = String(post?.bookTag?.author ?? "").trim();
  if (title && author) return `${title} (${author})`;
  if (title) return title;
  return "General discussion";
}

/** Basic HTML sanitizer for rendered post bodies (no extra deps). */
function sanitizePostHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    doc.querySelectorAll("script,iframe,object,embed").forEach((el) => el.remove());
    doc.querySelectorAll("a[href]").forEach((a) => {
      const h = a.getAttribute("href") ?? "";
      if (/^\s*javascript:/i.test(h)) a.removeAttribute("href");
    });
    return doc.body.innerHTML;
  } catch {
    return "";
  }
}

function looksLikeHtml(s) {
  const t = String(s ?? "").trim();
  return t.length > 0 && /<[a-z][\s\S]*>/i.test(t);
}

function PostBody({ content }) {
  const raw = String(content ?? "");
  if (looksLikeHtml(raw)) {
    return (
      <div
        className="blogs-post-content blogs-post-content--html"
        dangerouslySetInnerHTML={{ __html: sanitizePostHtml(raw) }}
      />
    );
  }
  return <p className="blogs-post-content">{raw}</p>;
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
      const response = await fetch(`${API}/posts`, { headers: { ...authHeader() } });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
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

  const ordered = useMemo(() => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [posts]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="blogs-page">
      <Header variant="user" />
      <main className="blogs-main">
        <section className={`blogs-header${showComposer ? " blogs-header--composer" : ""}`}>
          <h1>Blogs</h1>
          {showComposer ? (
            <button type="button" className="blogs-btn blogs-btn-close" onClick={() => setShowComposer(false)}>
              Close
            </button>
          ) : (
            <button type="button" className="blogs-btn blogs-btn-primary" onClick={() => setShowComposer(true)}>
              Create post
            </button>
          )}
        </section>

        {showComposer ? (
          <CreatePostComposer submitting={submitting} onSubmit={createPost} />
        ) : null}

        {loading ? <p className="blogs-hint">Loading posts...</p> : null}
        {error ? <p className="blogs-error">{error}</p> : null}

        <section className="blogs-feed" aria-label="Post feed">
          {ordered.map((post) => {
            const author = String(post?.authorId?.username ?? "Unknown");
            return (
              <article key={String(post?._id ?? post?.id)} className="blogs-post">
                <p className="blogs-post-meta">
                  <strong>{postTag(post)}</strong> · Posted by {author} · {since(post.createdAt)}
                </p>
                <h2 className="blogs-post-title">{String(post?.title ?? "")}</h2>
                <PostBody content={post?.content} />
                <div className="blogs-post-actions">
                  <button type="button" className="blogs-link-btn">
                    <MaterialIcon name="chat_bubble" /> Comments
                  </button>
                  <button type="button" className="blogs-link-btn">
                    <MaterialIcon name="share" /> Share
                  </button>
                  <button type="button" className="blogs-link-btn">
                    <MaterialIcon name="flag" /> Report
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
