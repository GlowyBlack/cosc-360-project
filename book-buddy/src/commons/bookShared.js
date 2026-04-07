import { useEffect, useState } from "react";
import { FALLBACK_BOOK_COVER_IMAGE } from "../config/images.js";

export function getBookRecordId(raw) {
  if (raw == null || typeof raw !== "object") return "";
  return raw._id != null ? String(raw._id) : raw.id != null ? String(raw.id) : "";
}

export function getBookTitle(raw) {
  return raw.bookTitle ?? raw.title ?? "Untitled";
}

export function getBookAuthor(raw) {
  return raw.bookAuthor ?? raw.author ?? "Unknown author";
}

export function getCoverUrlFromRaw(raw) {
  const imageUrl = raw?.bookImage ?? raw?.cover?.src ?? null;
  if (imageUrl == null || imageUrl === "") return "";
  return String(imageUrl);
}

export function buildBookCover(imageUrl, title) {
  return {
    src: imageUrl || FALLBACK_BOOK_COVER_IMAGE,
    alt: imageUrl ? `Cover: ${title}` : "No cover image",
  };
}

/** Thumb / inline image: use when `coverSrc` is already normalized (e.g. from our mappers). */
export function coverSrcOrFallback(url) {
  if (url == null || url === "") return FALLBACK_BOOK_COVER_IMAGE;
  return String(url);
}

/** Mongo owner id for comparing with session user `id` / `_id`. */
export function getBookOwnerId(raw) {
  if (raw?.bookOwner == null) return "";
  if (typeof raw.bookOwner === "object") {
    return String(raw.bookOwner._id ?? raw.bookOwner.id ?? "");
  }
  return String(raw.bookOwner);
}

export function getSessionUserId(user) {
  if (user == null) return "";
  return String(user.id ?? user._id ?? "");
}

export function resolveDiscoverOwner(raw) {
  let owner = raw.owner;
  if (owner == null && raw.bookOwner != null) {
    if (typeof raw.bookOwner === "object") {
      owner =
        raw.bookOwner.username ??
        raw.bookOwner.name ??
        "Community member";
    } else {
      owner = "Community member";
    }
  }
  return owner ?? "Community member";
}

export function resolveDiscoverStatus(raw) {
  return (
    raw.status ??
    (raw.isAvailable === true
      ? "Available"
      : raw.isAvailable === false
        ? "Unavailable"
        : "Available")
  );
}

/** Owner city/province string lives on populated `bookOwner`, not on the book document. */
export function resolveBookOwnerLocation(raw) {
  if (raw.bookOwner != null && typeof raw.bookOwner === "object") {
    const loc = raw.bookOwner.location;
    if (loc != null && String(loc).trim() !== "") return String(loc).trim();
  }
  if (raw.location != null && String(raw.location).trim() !== "") {
    return String(raw.location).trim();
  }
  return null;
}

export function toDiscoverCardBook(raw) {
  const id = getBookRecordId(raw);
  const title = getBookTitle(raw);
  const author = getBookAuthor(raw);
  const coverUrl = getCoverUrlFromRaw(raw);
  return {
    id,
    title,
    author,
    owner: resolveDiscoverOwner(raw),
    location: resolveBookOwnerLocation(raw),
    genre: raw.genre ?? null,
    status: resolveDiscoverStatus(raw),
    cover: buildBookCover(coverUrl, title),
  };
}

export function toLibraryPageCardBook(raw, currentUser) {
  const id = getBookRecordId(raw);
  const title = getBookTitle(raw);
  const author = getBookAuthor(raw);
  const coverUrl = getCoverUrlFromRaw(raw);
  const pending =
    raw.pendingRequestCount != null ? Number(raw.pendingRequestCount) : 0;

  const onLoan =
    raw.isOnLoan === true ||
    raw.onLoan === true ||
    raw.lentOut === true ||
    raw.borrowStatus === "out" ||
    raw.borrowStatus === "lent";

  return {
    id,
    title,
    author,
    owner: currentUser?.username ?? "You",
    location:
      (currentUser?.location != null && String(currentUser.location).trim() !== ""
        ? String(currentUser.location).trim()
        : null) ?? resolveBookOwnerLocation(raw),
    isAvailable: raw.isAvailable === true,
    onLoan,
    pendingRequestCount: Number.isFinite(pending) && pending >= 0 ? pending : 0,
    cover: buildBookCover(coverUrl, title),
  };
}

export function bookGenreMatchesFilter(bookGenre, activeFilter) {
  if (activeFilter === "All") return true;
  if (bookGenre == null) return false;
  if (Array.isArray(bookGenre)) return bookGenre.includes(activeFilter);
  return String(bookGenre).includes(activeFilter);
}

export function resolveCoverAlt(cover, rawSrc) {
  const hasSrc = rawSrc != null && rawSrc !== "";
  if (typeof cover === "string") {
    return hasSrc ? "" : "No cover image";
  }
  return cover?.alt ?? (hasSrc ? "" : "No cover image");
}

export function useBookCoverDisplaySrc(coverUrl) {
  const resolved =
    coverUrl != null && coverUrl !== "" ? String(coverUrl) : "";
  const preferredSrc = resolved || FALLBACK_BOOK_COVER_IMAGE;

  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [resolved]);

  const displaySrc = loadFailed ? FALLBACK_BOOK_COVER_IMAGE : preferredSrc;

  const onImgError = () => {
    setLoadFailed(true);
  };

  return { displaySrc, onImgError };
}
