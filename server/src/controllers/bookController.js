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
            const { req } = req.query;
            const results = bookService.searchBooksFromMock(term);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async getBookByBookId(req, res){
        try{
            const { id } = req.params;
            const book = await bookService.getBookByBookId(id);
        } catch (error){
            res.status(500).json({ message: "Server Error", error: error.message })
        }
    },

    async updateDetails(req, res){
        try{
            const data = req.body;
            const book = await bookService.updateDetails(data)
            res.status(201).json(book)
        } catch (error){
            res.status(500).json({ message: "Server Error", error: error.message })
        }
    },

    async deleteBook(req, res){
        try{
            const { id } = req.params;
            const userId = req.user?._id
            const book = await bookService.deleteBook(id, userId);
            res.status(201).json(book)
        } catch (error){
            res.status(500).json({ message: "Server Error", error: error.message })
        }
    },
};



export default BookController;