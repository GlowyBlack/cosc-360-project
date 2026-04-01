import { useState } from "react";
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
    location: raw.location ?? null,
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
  return {
    id,
    title,
    author,
    owner: currentUser?.username ?? "You",
    location: raw.location ?? null,
    isAvailable: raw.isAvailable === true,
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

  const [prevResolved, setPrevResolved] = useState(resolved);
  const [loadFailed, setLoadFailed] = useState(false);

  if (resolved !== prevResolved) {
    setPrevResolved(resolved);
    setLoadFailed(false);
  }

  const displaySrc = loadFailed ? FALLBACK_BOOK_COVER_IMAGE : preferredSrc;

  const onImgError = () => {
    setLoadFailed(true);
  };

  return { displaySrc, onImgError };
}
