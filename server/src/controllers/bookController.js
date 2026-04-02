import bookService from "../services/bookService.js";

const BookController = {
    async getBookGenres(req, res) {
        try {
            const { BOOK_GENRES } = await import("../constants/bookGenres.js");
            res.status(200).json({ genres: [...BOOK_GENRES] });
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async getAllBooks(req, res) {
        try {
            const books = await bookService.getAllBooks();
            res.status(200).json(books);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async createBook(req, res) {
        try {
            const data = { ...req.body };
            const userID = req.user?._id ?? req.user?.id;
            if (!userID) {
                return res.status(400).json({ message: "Unauthorized" });
            }
            data.bookOwner = userID;
            const book = await bookService.createBook(data);
            res.status(201).json(book);
        } catch (error) {
            const msg = error.message;
            const badRequest = [
                "Title and author are required",
                "Please provide the summary of the book",
                "Select at least one genre",
                "Book owner is required",
            ];
            if (badRequest.includes(msg)) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: "Server Error", error: msg });
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
            res.status(200).json(books);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async searchBooks(req, res) {
        try {
            const q = req.query.q ?? req.query.query ?? "";
            const results = await bookService.searchBooks(String(q));
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
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
            if (error.name === "CastError") {
                return res.status(400).json({ message: "Invalid book id" });
            }
            if (error.message === "Book ID is required") {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async updateDetails(req, res) {
        try {
            const { bookId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const book = await bookService.updateDetails(bookId, userId, req.body);
            res.status(200).json(book);
        } catch (error) {
            const msg = error.message;
            if (msg === "Book not found") {
                return res.status(404).json({ message: msg });
            }
            if (msg.includes("can't edit")) {
                return res.status(403).json({ message: msg });
            }
            if (msg === "Book ID is required." || msg === "User ID is required") {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: "Server Error", error: msg });
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
            res.status(204).send();
        } catch (error) {
            const msg = error.message;
            if (msg === "Book not found") {
                return res.status(404).json({ message: msg });
            }
            if (msg.includes("can't delete")) {
                return res.status(403).json({ message: msg });
            }
            if (msg === "Book ID is required") {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: "Server Error", error: msg });
        }
    },
};



export default BookController;
