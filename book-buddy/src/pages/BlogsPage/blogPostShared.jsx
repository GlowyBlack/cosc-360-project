import API, { authHeader, flashSessionExpired } from "../../config/api.js";

export const PREVIEW_MAX_CHARS = 600;

export function postTag(post) {
  const title = String(post?.bookTag?.title ?? "").trim();
  const author = String(post?.bookTag?.author ?? "").trim();
  if (title && author) return `${title} (${author})`;
  if (title) return title;
  return "General discussion";
}

export function sanitizePostHtml(html) {
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

export function looksLikeHtml(s) {
  const t = String(s ?? "").trim();
  return t.length > 0 && /<[a-z][\s\S]*>/i.test(t);
}

export function postContentToPlain(s) {
  const raw = String(s ?? "");
  if (looksLikeHtml(raw)) {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return raw.replace(/\s+/g, " ").trim();
}

export function previewPlainContent(content, max = PREVIEW_MAX_CHARS) {
  const plain = postContentToPlain(content);
  if (plain.length <= max) return { text: plain, truncated: false };
  return { text: `${plain.slice(0, max).trimEnd()}…`, truncated: true };
}

export function PostBody({ content }) {
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

export async function togglePostReaction({ postId, mode, logout }) {
  if (!postId) throw new Error("Post id is required");
  if (mode !== "like" && mode !== "dislike") {
    throw new Error("Invalid reaction mode");
  }
  const response = await fetch(`${API}/posts/${encodeURIComponent(postId)}/${mode}`, {
    method: "PATCH",
    headers: { ...authHeader() },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    flashSessionExpired();
    logout?.();
    throw new Error(data.message ?? "Not authenticated");
  }
  if (!response.ok) {
    throw new Error(data.message ?? `Could not ${mode} post`);
  }
  return data;
}
