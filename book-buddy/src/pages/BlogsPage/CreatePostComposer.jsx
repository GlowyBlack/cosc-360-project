import { useCallback, useEffect, useRef, useState } from "react";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";

function exec(cmd, value = null) {
  try {
    document.execCommand(cmd, false, value);
  } catch {
    /* ignore */
  }
}

export default function CreatePostComposer({ onSubmit, submitting = false }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [editorEmpty, setEditorEmpty] = useState(true);
  const editorRef = useRef(null);

  const syncEmpty = useCallback((el) => {
    const t = el?.innerText?.replace(/\u200b/g, "").trim() ?? "";
    setEditorEmpty(t.length === 0);
  }, []);

  const afterEdit = useCallback(() => {
    queueMicrotask(() => {
      const el = editorRef.current;
      if (el) syncEmpty(el);
    });
  }, [syncEmpty]);

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const handleToolbarMouseDown = useCallback((e) => {
    e.preventDefault();
  }, []);

  const applyBold = useCallback(() => {
    focusEditor();
    exec("bold");
    afterEdit();
  }, [focusEditor, afterEdit]);

  const applyItalic = useCallback(() => {
    focusEditor();
    exec("italic");
    afterEdit();
  }, [focusEditor, afterEdit]);

  const applyLink = useCallback(() => {
    focusEditor();
    const url = window.prompt("Link URL", "https://");
    if (url == null || url.trim() === "") return;
    exec("createLink", url.trim());
    afterEdit();
  }, [focusEditor, afterEdit]);

  const applyBlockquote = useCallback(() => {
    focusEditor();
    exec("formatBlock", "blockquote");
    afterEdit();
  }, [focusEditor, afterEdit]);

  const applyBulletList = useCallback(() => {
    focusEditor();
    exec("insertUnorderedList");
    afterEdit();
  }, [focusEditor, afterEdit]);

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const html = editorRef.current?.innerHTML ?? "";
    const plain = editorRef.current?.innerText ?? "";
    if (!title.trim() || !plain.trim()) {
      setError("Post title and content are required.");
      return;
    }
    await onSubmit({
      title: title.trim(),
      content: html.trim(),
      bookTag: { title: null, author: null },
    }).catch((err) => {
      setError(err?.message ?? "Could not create post");
    });
  };

  return (
    <form className="blogs-composer" onSubmit={submit}>
      <div className="blogs-composer-tabs" role="tablist" aria-label="Create post mode">
        <button type="button" role="tab" aria-selected className="blogs-tab blogs-tab--active">
          <MaterialIcon name="edit_note" /> Post
        </button>
      </div>

      <div className="blogs-title-row">
        <input
          className="blogs-input blogs-input-title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 300))}
        />
        <span className="blogs-char-count">{title.length}/300</span>
      </div>

      <div className="blogs-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className="blogs-toolbar-btn"
          title="Bold"
          aria-label="Bold"
          onMouseDown={handleToolbarMouseDown}
          onClick={applyBold}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="blogs-toolbar-btn"
          title="Italic"
          aria-label="Italic"
          onMouseDown={handleToolbarMouseDown}
          onClick={applyItalic}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="blogs-toolbar-btn"
          title="Insert link"
          aria-label="Insert link"
          onMouseDown={handleToolbarMouseDown}
          onClick={applyLink}
        >
          🔗
        </button>
        <button
          type="button"
          className="blogs-toolbar-btn"
          title="Quote"
          aria-label="Quote"
          onMouseDown={handleToolbarMouseDown}
          onClick={applyBlockquote}
        >
          ❝
        </button>
        <button
          type="button"
          className="blogs-toolbar-btn"
          title="Bullet list"
          aria-label="Bullet list"
          onMouseDown={handleToolbarMouseDown}
          onClick={applyBulletList}
        >
          ≡
        </button>
      </div>

      <div
        ref={editorRef}
        className={`blogs-editor${editorEmpty ? " blogs-editor--empty" : ""}`}
        contentEditable={!submitting}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Post body"
        data-placeholder="Begin your discussion"
        onInput={(e) => syncEmpty(e.currentTarget)}
        onBlur={(e) => syncEmpty(e.currentTarget)}
      />

      {error ? <p className="blogs-error blogs-error--composer">{error}</p> : null}
      <div className="blogs-composer-actions">
        <button type="submit" className="blogs-btn blogs-btn-primary" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
