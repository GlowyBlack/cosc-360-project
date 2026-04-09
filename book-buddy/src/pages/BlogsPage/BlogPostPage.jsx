import { useEffect, useMemo, useState } from "react";
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
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reacting, setReacting] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openReplyFor, setOpenReplyFor] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentReactingId, setCommentReactingId] = useState("");
  const [replyVisibleCount, setReplyVisibleCount] = useState({});

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
        const list = Array.isArray(data?.comments) ? data.comments : [];
        if (!doc || (doc._id == null && doc.id == null)) {
          throw new Error("Post not found");
        }
        if (!cancelled) {
          setPost(doc);
          setComments(list);
        }
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
  const commentsByParent = useMemo(() => {
    const map = new Map();
    for (const c of comments) {
      const key = String(c?.parentId ?? "");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return map;
  }, [comments]);
  const rootComments = commentsByParent.get("") ?? [];

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

  const upsertComment = (updated) => {
    const id = String(updated?._id ?? updated?.id ?? "");
    if (!id) return;
    setComments((prev) => {
      const idx = prev.findIndex((c) => String(c?._id ?? c?.id ?? "") === id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  };

  const createComment = async (parentId = null) => {
    const id = String(post?._id ?? post?.id ?? "");
    const draft = parentId ? String(replyDrafts[parentId] ?? "") : commentDraft;
    if (!id || !draft.trim() || commentBusy) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/blogs/${postId}`)}`);
      return;
    }
    setCommentBusy(true);
    setCommentError("");
    try {
      const response = await fetch(`${API}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          postId: id,
          content: draft.trim(),
          parentId: parentId || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) throw new Error(data.message ?? "Could not post comment");
      setComments((prev) => [...prev, data]);
      if (parentId) {
        setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
        setOpenReplyFor("");
      } else {
        setCommentDraft("");
      }
    } catch (e) {
      setCommentError(e.message ?? "Could not post comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const toggleCommentReaction = async (commentId, mode) => {
    const id = String(commentId ?? "");
    if (!id || commentReactingId === id) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/blogs/${postId}`)}`);
      return;
    }
    setCommentReactingId(id);
    setCommentError("");
    try {
      const response = await fetch(`${API}/comments/${encodeURIComponent(id)}/${mode}`, {
        method: "PATCH",
        headers: { ...authHeader() },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        flashSessionExpired();
        logout();
        return;
      }
      if (!response.ok) throw new Error(data.message ?? `Could not ${mode} comment`);
      upsertComment(data);
    } catch (e) {
      setCommentError(e.message ?? "Could not react to comment");
    } finally {
      setCommentReactingId("");
    }
  };

  const renderCommentTree = (items, depth = 0) =>
    items.map((comment) => {
      const id = String(comment?._id ?? comment?.id ?? "");
      const replies = commentsByParent.get(id) ?? [];
      const visibleCount = replyVisibleCount[id] ?? 2;
      const shownReplies = replies.slice(0, visibleCount);
      const remainingReplies = Math.max(0, replies.length - shownReplies.length);
      const likedByMe = (comment?.likes ?? []).some(
        (v) => String(v?._id ?? v?.id ?? v) === sessionUserId,
      );
      const dislikedByMe = (comment?.dislikes ?? []).some(
        (v) => String(v?._id ?? v?.id ?? v) === sessionUserId,
      );
      const score =
        Number(comment?.likeCount ?? comment?.likes?.length ?? 0) -
        Number(comment?.dislikeCount ?? comment?.dislikes?.length ?? 0);
      const authorName = String(comment?.authorId?.username ?? "reader");
      const replyOpen = openReplyFor === id;

      return (
        <article key={id} className="blog-comment" style={{ marginLeft: `${depth * 24}px` }}>
          <div className="blog-comment-votes">
            <button
              type="button"
              className={`blogs-link-btn blogs-vote-btn${likedByMe ? " blogs-vote-btn--active" : ""}`}
              onClick={() => toggleCommentReaction(id, "like")}
              disabled={commentReactingId === id}
              aria-label="Like comment"
            >
              <MaterialIcon name="arrow_upward" />
            </button>
            <span className="blog-comment-score">{score}</span>
            <button
              type="button"
              className={`blogs-link-btn blogs-vote-btn${dislikedByMe ? " blogs-vote-btn--active" : ""}`}
              onClick={() => toggleCommentReaction(id, "dislike")}
              disabled={commentReactingId === id}
              aria-label="Dislike comment"
            >
              <MaterialIcon name="arrow_downward" />
            </button>
          </div>
          <div className="blog-comment-body">
            <p className="blog-comment-meta">
              <strong>{authorName}</strong> · {since(comment?.createdAt)}
            </p>
            <p className="blog-comment-text">{String(comment?.content ?? "")}</p>
            <div className="blog-comment-actions">
              <button
                type="button"
                className="blogs-link-btn"
                onClick={() => setOpenReplyFor((prev) => (prev === id ? "" : id))}
              >
                Reply
              </button>
            </div>
            {replyOpen ? (
              <div className="blog-reply-composer">
                <textarea
                  className="blog-comment-input"
                  rows={3}
                  placeholder="Write a reply..."
                  value={replyDrafts[id] ?? ""}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="blogs-btn blogs-btn-primary blog-comment-submit"
                  onClick={() => createComment(id)}
                  disabled={commentBusy || !String(replyDrafts[id] ?? "").trim()}
                >
                  Reply
                </button>
              </div>
            ) : null}
            {shownReplies.length > 0 ? renderCommentTree(shownReplies, depth + 1) : null}
            {remainingReplies > 0 ? (
              <div className="blog-comment-more-replies">
                <button
                  type="button"
                  className="blogs-link-btn"
                  onClick={() =>
                    setReplyVisibleCount((prev) => ({
                      ...prev,
                      [id]: (prev[id] ?? 2) + 4,
                    }))
                  }
                >
                  Show {Math.min(4, remainingReplies)} more repl
                  {Math.min(4, remainingReplies) === 1 ? "y" : "ies"}
                </button>
                <button
                  type="button"
                  className="blogs-link-btn"
                  onClick={() =>
                    setReplyVisibleCount((prev) => ({
                      ...prev,
                      [id]: replies.length,
                    }))
                  }
                >
                  Show all replies
                </button>
              </div>
            ) : null}
          </div>
        </article>
      );
    });

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
            <section className="blog-comments-wrap" id="comments">
              <h2 className="blog-comments-title">Discuss</h2>
              {user ? (
                <div className="blog-comment-composer">
                  <textarea
                    className="blog-comment-input"
                    rows={4}
                    placeholder="Comment"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                  />
                  <div className="blog-comment-submit-row">
                    <button
                      type="button"
                      className="blogs-btn blogs-btn-primary blog-comment-submit"
                      onClick={() => createComment(null)}
                      disabled={commentBusy || !commentDraft.trim()}
                    >
                      Post comment
                    </button>
                  </div>
                </div>
              ) : (
                <p className="blogs-hint">
                  <Link to={`/login?next=${encodeURIComponent(`/blogs/${postId}`)}`}>
                    Log in
                  </Link>{" "}
                  to comment.
                </p>
              )}
              {commentError ? <p className="blogs-error">{commentError}</p> : null}
              <div className="blog-comments-list">
                {rootComments.length > 0 ? (
                  renderCommentTree(rootComments)
                ) : (
                  <p className="blogs-hint">No comments yet.</p>
                )}
              </div>
            </section>
          </article>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
