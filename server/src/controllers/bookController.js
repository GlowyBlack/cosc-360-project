import bookService from "../services/bookService.js";
import { sendServiceError } from "../utils/httpError.js";

const BookController = {
    async getBookGenres(req, res) {
        try {
            const { BOOK_GENRES } = await import("../constants/bookGenres.js");
            return res.status(200).json({ genres: [...BOOK_GENRES] });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getAllBooks(req, res) {
        try {
            const books = await bookService.getAllBooks();
            return res.status(200).json(books);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async createBook(req, res) {
        try {
            const data = { ...req.body };
            if (req.file?.path || req.file?.secure_url) {
                data.bookImage = req.file.path ?? req.file.secure_url;
            }
            const userID = req.user?._id ?? req.user?.id;
            if (!userID) {
                return res.status(400).json({ message: "Unauthorized" });
            }
            data.bookOwner = userID;
            const book = await bookService.createBook(data);
            res.status(201).json(book);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async findBooksByUserId(req, res) {
        try {
            const rawUserId = req.params.userId ?? req.user?._id ?? req.user?.id;
            if (!rawUserId) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            const userId = String(rawUserId);
            const books = await bookService.findBooksByUserId(userId);
            return res.status(200).json(books);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async searchBooks(req, res) {
        try {
            const q = req.query.q ?? req.query.query ?? "";
            const results = await bookService.searchBooks(String(q));
            return res.status(200).json(results);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getBookByBookId(req, res) {
        try {
            const bookId = req.params.bookId ?? req.params.id;
            const book = await bookService.getBookByBookId(bookId);
            if (!book) {
                return res.status(404).json({ message: "Book not found" });
            }
            res.status(200).json(book);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async updateDetails(req, res) {
        try {
            const { bookId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const payload = { ...req.body };
            if (req.file?.path || req.file?.secure_url) {
                payload.bookImage = req.file.path ?? req.file.secure_url;
            }
            const book = await bookService.updateDetails(bookId, userId, payload);
            return res.status(200).json(book);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async deleteBook(req, res) {
        try {
            const { bookId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            await bookService.deleteBook(bookId, userId);
            return res.status(204).send();
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async toggleAvailability(req, res) {
        try {
            const { bookId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const book = await bookService.toggleAvailability(bookId, userId);
            return res.status(200).json(book);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },
};

export default BookController;
