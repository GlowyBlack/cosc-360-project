import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CreatePostComposer from "./CreatePostComposer.jsx";
import PostMoreMenu from "./PostMoreMenu.jsx";
import {
  PREVIEW_MAX_CHARS,
  deletePost,
  isPostOwner,
  postTag,
  previewPlainContent,
  togglePostReaction,
} from "./blogPostShared.jsx";
import "./BlogsPage.css";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import { getSessionUserId } from "../../commons/bookShared.js";

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const sessionUserId = getSessionUserId(user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState("top");
  const [reactingPostId, setReactingPostId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { ...authHeader() };
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const response = await fetch(`${API}/posts${params.toString() ? `?${params}` : ""}`, {
        headers,
      });
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
  }, [searchQuery]);

  useEffect(() => {
    if (!user) setShowComposer(false);
  }, [user]);

  const updatePost = async (payload) => {
    const id = String(editingPost?._id ?? editingPost?.id ?? "");
    if (!id) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/posts/${encodeURIComponent(id)}`, {
        method: "PATCH",
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
        throw new Error(data.message ?? "Could not update post");
      }
      setEditingPost(null);
      await loadPosts();
    } catch (e) {
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const id = String(postId ?? "").trim();
    if (!id) return;
    if (
      !window.confirm(
        "Remove this post? It will no longer appear for readers.",
      )
    ) {
      return;
    }
    try {
      await deletePost({ postId: id, logout });
      setEditingPost((cur) => {
        const curId = String(cur?._id ?? cur?.id ?? "");
        return curId === id ? null : cur;
      });
      await loadPosts();
    } catch (e) {
      setError(e.message ?? "Could not delete post");
    }
  };

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

  const handleReact = async (postId, mode) => {
    if (!postId) return;
    if (!user) {
      navigate("/login?next=/blogs");
      return;
    }
    if (reactingPostId === postId) return;
    setReactingPostId(postId);
    try {
      const data = await togglePostReaction({ postId, mode, logout });
      setPosts((prev) =>
        prev.map((p) => {
          const id = String(p?._id ?? p?.id ?? "");
          return id === String(postId) ? data : p;
        }),
      );
    } catch (e) {
      setError(e.message ?? "Could not update reaction");
    } finally {
      setReactingPostId("");
    }
  };

  const ordered = useMemo(() => {
    const list = [...posts];
    if (sortMode === "new") {
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list.sort((a, b) => {
      const aScore = Number(a?.likeCount ?? 0) - Number(a?.dislikeCount ?? 0);
      const bScore = Number(b?.likeCount ?? 0) - Number(b?.dislikeCount ?? 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [posts, sortMode]);

  return (
    <div className="blogs-page">
      <Header variant={user ? "user" : "guest"} />
      <main className="blogs-main">
        <section
          className={`blogs-header${showComposer ? " blogs-header--composer" : ""}`}
        >
          <div className="blogs-header-left">
            <button
              type="button"
              className="blogs-sort-toggle"
              onClick={() => setSortMode((prev) => (prev === "top" ? "new" : "top"))}
            >
              {sortMode === "top" ? "Top (Most Likes)" : "New (Created Time)"}
            </button>
            <input
              type="search"
              className="blogs-search-input"
              placeholder="Search by book title, author, post title, user"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

        {user && showComposer && !editingPost ? (
          <CreatePostComposer submitting={submitting} onSubmit={createPost} />
        ) : null}

        {user && editingPost ? (
          <section className="blogs-edit-wrap" aria-label="Edit post">
            <CreatePostComposer
              key={String(editingPost._id ?? editingPost.id)}
              resetKey={String(editingPost._id ?? editingPost.id)}
              initialValues={{
                title: editingPost.title,
                content: editingPost.content,
                bookTag: editingPost.bookTag ?? {},
              }}
              onSubmit={updatePost}
              onCancel={() => setEditingPost(null)}
              submitting={submitting}
            />
          </section>
        ) : null}

        {!(user && showComposer) && !(user && editingPost) && loading ? (
          <p className="blogs-hint">Loading posts...</p>
        ) : null}
        {!(user && showComposer) && !(user && editingPost) && error ? (
          <p className="blogs-error">{error}</p>
        ) : null}

        {!(user && showComposer) && !(user && editingPost) ? (
          <section className="blogs-feed" aria-label="Post feed">
            {ordered.map((post, index) => {
              const id = String(post?._id ?? post?.id ?? "");
              const author = String(post?.authorId?.username ?? "Unknown");
              const { text: previewText, truncated } = previewPlainContent(
                post?.content,
                PREVIEW_MAX_CHARS,
              );
              const score = Number(post?.likeCount ?? 0) - Number(post?.dislikeCount ?? 0);
              const likedByMe = (post?.likes ?? []).some(
                (v) => String(v?._id ?? v?.id ?? v) === sessionUserId,
              );
              const dislikedByMe = (post?.dislikes ?? []).some(
                (v) => String(v?._id ?? v?.id ?? v) === sessionUserId,
              );
              const reacting = reactingPostId === id;
              return (
                <article key={id || `post-${index}`} className="blogs-post">
                  <div className="blogs-post-meta-row">
                    <p className="blogs-post-meta">
                      <strong>{postTag(post)}</strong> · Posted by {author} ·{" "}
                      {since(post.createdAt)}
                    </p>
                    <PostMoreMenu
                      isOwner={isPostOwner(post, sessionUserId)}
                      onEdit={() => {
                        setShowComposer(false);
                        setEditingPost(post);
                      }}
                      onDelete={() => handleDeletePost(id)}
                      disabled={Boolean(editingPost)}
                    />
                  </div>
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
                      <MaterialIcon name="flag" /> Report
                    </button>
                    <button
                      type="button"
                      className={`blogs-link-btn blogs-vote-btn${
                        likedByMe ? " blogs-vote-btn--active" : ""
                      }`}
                      onClick={() => handleReact(id, "like")}
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
                      onClick={() => handleReact(id, "dislike")}
                      disabled={reacting}
                    >
                      <MaterialIcon name="arrow_downward" />
                    </button>
                  </div>
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
