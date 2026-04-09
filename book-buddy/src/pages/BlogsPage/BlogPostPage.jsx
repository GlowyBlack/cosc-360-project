import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { PostBody, postTag } from "./blogPostShared.jsx";
import "./BlogsPage.css";

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

export default function BlogPostPage() {
  const { postId } = useParams();
  const { user, logout } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const headers = { ...authHeader() };
        const response = await fetch(`${API}/posts/${encodeURIComponent(postId)}`, {
          headers,
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          if (headers.Authorization) {
            flashSessionExpired();
            logout();
          }
          throw new Error(data.message ?? "Could not load post");
        }
        if (!response.ok) {
          throw new Error(data.message ?? "Could not load post");
        }
        const doc = data?.post ?? data;
        if (!doc || (doc._id == null && doc.id == null)) {
          throw new Error("Post not found");
        }
        if (!cancelled) setPost(doc);
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? "Could not load post");
          setPost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [postId, logout]);

  const author = String(post?.authorId?.username ?? "Unknown");

  return (
    <div className="blogs-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="blogs-main">
        <section className="blogs-header">
          <Link to="/blogs" className="blogs-back-link">
            ← Back to Blogs
          </Link>
        </section>

        {loading ? <p className="blogs-hint">Loading post...</p> : null}
        {error ? <p className="blogs-error">{error}</p> : null}

        {!loading && post ? (
          <article className="blogs-post blogs-post--detail">
            <p className="blogs-post-meta">
              <strong>{postTag(post)}</strong> · Posted by {author} · {since(post.createdAt)}
            </p>
            <h1 className="blogs-post-title blogs-post-title--detail">{String(post?.title ?? "")}</h1>
            <PostBody content={post?.content} />
            <div className="blogs-post-actions">
              {user ? (
                <button type="button" className="blogs-link-btn" id="comments">
                  <MaterialIcon name="chat_bubble" /> Comments
                </button>
              ) : (
                <Link
                  to={`/login?next=${encodeURIComponent(`/blogs/${postId}`)}`}
                  className="blogs-link-btn"
                >
                  <MaterialIcon name="chat_bubble" /> Log in to comment
                </Link>
              )}
              <button type="button" className="blogs-link-btn">
                <MaterialIcon name="share" /> Share
              </button>
              <button type="button" className="blogs-link-btn">
                <MaterialIcon name="flag" /> Report
              </button>
            </div>
          </article>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
