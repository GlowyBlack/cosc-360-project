import BookService from "../services/book-service.js"


const BookController = {
    async getAllBooks(req, res) {
        try {
            const books = await BookService.getAllBooks();
            res.status(200).json(books);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async createBook(req, res) {
        try {
            const data = req.body;
            const userID = req.user?._id;
            if (!userID) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            data.book_owner = userID;
            const book = await BookService.createBook(data);
            res.status(201).json(book);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message })
        }
    },

    async findBook(){}
};



export default { BookController };