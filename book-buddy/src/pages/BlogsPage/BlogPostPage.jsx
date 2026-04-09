import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { PostBody, postTag, togglePostReaction } from "./blogPostShared.jsx";
import { getSessionUserId } from "../../commons/bookShared.js";
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
  const navigate = useNavigate();
  const { postId } = useParams();
  const { user, logout } = useAuth();
  const sessionUserId = getSessionUserId(user);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reacting, setReacting] = useState(false);

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
  const likedByMe = (post?.likes ?? []).some(
    (v) => String(v?._id ?? v?.id ?? v) === sessionUserId,
  );
  const dislikedByMe = (post?.dislikes ?? []).some(
    (v) => String(v?._id ?? v?.id ?? v) === sessionUserId,
  );
  const score = Number(post?.likeCount ?? 0) - Number(post?.dislikeCount ?? 0);

  const handleReact = async (mode) => {
    const id = String(post?._id ?? post?.id ?? "");
    if (!id || reacting) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/blogs/${postId}`)}`);
      return;
    }
    setReacting(true);
    setError("");
    try {
      const updated = await togglePostReaction({ postId: id, mode, logout });
      setPost(updated);
    } catch (e) {
      setError(e.message ?? "Could not update reaction");
    } finally {
      setReacting(false);
    }
  };

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
              <button
                type="button"
                className={`blogs-link-btn blogs-vote-btn${
                  likedByMe ? " blogs-vote-btn--active" : ""
                }`}
                onClick={() => handleReact("like")}
                disabled={reacting}
              >
                <MaterialIcon name="arrow_upward" />
              </button>
              <span className="blogs-post-score">{score}</span>
              <button
                type="button"
                className={`blogs-link-btn blogs-vote-btn${
                  dislikedByMe ? " blogs-vote-btn--active" : ""
                }`}
                onClick={() => handleReact("dislike")}
                disabled={reacting}
              >
                <MaterialIcon name="arrow_downward" />
              </button>
            </div>
          </article>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
