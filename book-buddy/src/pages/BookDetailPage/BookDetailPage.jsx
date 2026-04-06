import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import MaterialIcon from "../../components/MaterialIcon/MaterialIcon.jsx";
import ExchangeProposalModal from "../../components/ExchangeProposalModal/ExchangeProposalModal.jsx";
import API, { authHeader, flashSessionExpired } from "../../config/api.js";
import { getBookOwnerId, coverSrcOrFallback } from "../../commons/bookShared.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./BookDetailPage.css";

// create one socket connection for this page
const socket = io("http://localhost:5001");

export default function BookDetailPage() {
    const { bookId } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exchangeOpen, setExchangeOpen] = useState(false);

    const closeExchange = useCallback(() => setExchangeOpen(false), []);

    const handleBack = useCallback(() => navigate(-1), [navigate]);

    const ownerName = useMemo(() => {
        if (!book?.bookOwner) return "";
        const o = book.bookOwner;
        if (typeof o === "object" && o.username) return `@${o.username}`;
        return "";
    }, [book]);

    const recordId = useMemo(() => {
        if (!book) return "";
        return String(book._id ?? book.id ?? "").slice(-6).toUpperCase();
    }, [book]);

    const actionsDisabled = useMemo(() => {
        if (!book) return true;
        return book.isAvailable !== true;
    }, [book]);

    const isOwner = useMemo(() => {
        if (!user || !book) return false;
        const ownerId = String(getBookOwnerId(book) ?? "").trim();
        const userId = String(user._id ?? user.id ?? "").trim();
        return ownerId === userId && ownerId !== "";
    }, [user, book]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!bookId || !/^[a-f\d]{24}$/i.test(String(bookId).trim())) {
                setError("Invalid book link.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError("");
            try {
                const response = await fetch(`${API}/books/${encodeURIComponent(bookId)}`);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message ?? data.detail ?? "Could not load this book");
                }
                if (!cancelled) setBook(data);
            } catch (e) {
                if (!cancelled) {
                    setError(e.message ?? "Could not load this book");
                    setBook(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [bookId]);

    const handleProposeExchange = useCallback(
        async ({ offeredBookIds }) => {
            const offeredBookId = offeredBookIds[0];
            const targetBookId = bookId ? String(bookId).trim() : "";
            const obid = offeredBookId ? String(offeredBookId).trim() : "";
            if (!/^[a-f\d]{24}$/i.test(targetBookId)) {
                throw new Error("Invalid book.");
            }
            if (!/^[a-f\d]{24}$/i.test(obid)) {
                throw new Error("Invalid offered book.");
            }

            const verifyRes = await fetch(`${API}/books/${encodeURIComponent(targetBookId)}`);
            const freshBook = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
                throw new Error(freshBook.message ?? freshBook.detail ?? "Could not verify this listing.");
            }
            if (freshBook.isAvailable !== true) {
                throw new Error("This book is no longer available to request.");
            }
            const oid = String(getBookOwnerId(freshBook)).trim();
            if (!/^[a-f\d]{24}$/i.test(oid)) {
                throw new Error("Could not determine the current owner. Try again.");
            }

            const response = await fetch(`${API}/requests/exchange`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader(),
                },
                body: JSON.stringify({
                    bookId: targetBookId,
                    ownerId: oid,
                    offeredBookId: obid,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 401) {
                flashSessionExpired();
                logout();
                throw new Error(data.message ?? "Session expired. Please sign in again.");
            }
            if (!response.ok) {
                throw new Error(
                    data.error ?? data.detail ?? data.message ?? "Could not send exchange proposal.",
                );
            }

            // exchange was created successfully
            // notify the book owner in real time so their RequestPage updates instantly
            // oid is the owner's userId — they are in a socket room named after their id
            socket.emit("new_request", { ownerId: oid });
        },
        [bookId, logout],
    );

    return (
        <div className="book-detail-page">
            <Header variant={user ? "user" : "guest"} />
            <main className="book-detail-page-main">
                <button type="button" className="book-detail-back" onClick={handleBack}>
                    <MaterialIcon name="west" className="book-detail-back-icon" aria-hidden />
                    <span>Back</span>
                </button>

                {loading ? <p className="book-detail-state">Loading…</p> : null}
                {error ? <p className="book-detail-state book-detail-state--error">{error}</p> : null}

                {!loading && !error && book ? (
                    <div className="book-detail-layout">
                        <div className="book-detail-col book-detail-col--media">
                            <div className="book-detail-cover-frame">
                                <img
                                    src={coverSrcOrFallback(book.bookImage)}
                                    alt={`Cover of ${book.bookTitle}`}
                                    className="book-detail-cover"
                                />
                            </div>
                        </div>

                        <div className="book-detail-col book-detail-col--info">
                            <h1 className="book-detail-title">{book.bookTitle ?? "Untitled"}</h1>
                            <p className="book-detail-author">{book.bookAuthor ?? "Unknown author"}</p>

                            {ownerName ? (
                                <p className="book-detail-owner">Owned by {ownerName}</p>
                            ) : null}

                            <p className="book-detail-desc">{book.description ?? ""}</p>

                            {!isOwner && user ? (
                                <div className="book-detail-actions">
                                    <button
                                        type="button"
                                        className={`book-detail-action book-detail-action--exchange ${actionsDisabled ? "book-detail-action--disabled" : ""}`.trim()}
                                        disabled={actionsDisabled}
                                        onClick={() => setExchangeOpen(true)}
                                    >
                                        Propose exchange
                                    </button>
                                </div>
                            ) : null}

                            <div className="book-detail-footer-row">
                                <span className="book-detail-id">ID: {recordId}</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            {book ? (
                <ExchangeProposalModal
                    open={exchangeOpen}
                    onClose={closeExchange}
                    targetBook={book}
                    ownerName={ownerName}
                    onPropose={handleProposeExchange}
                />
            ) : null}
            <Footer />
        </div>
    );
}
