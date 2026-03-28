import bookService from "../services/bookService.js"


const BookController = {
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
            const data = req.body;
            const userID = req.user?._id ?? data.book_owner;
            if (!userID) {
                return res.status(400).json({ message: "Unauthorized" });
            }
            data.book_owner = userID;
            const book = await bookService.createBook(data);
            res.status(201).json(book);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message })
        }
    },

    async findBooksByUserId(req, res) {
        try {
            const { userId } = req.params;
            const books = await bookService.findBooksByUserId(userId);
            res.status(200).json(books);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async searchBooks(req, res) {
        try {
            const { term } = req.query;
            const results = bookService.searchBooksFromMock(term);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },
};



export default BookController;