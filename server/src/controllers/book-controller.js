import bookService from "../services/book-service.js"

const getAllBooks = async (req, res) => {
    try {
        const books = await bookService.getAllBooks();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export default {getAllBooks};