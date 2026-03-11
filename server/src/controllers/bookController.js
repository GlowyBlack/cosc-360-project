const bookService = require('../services/bookService');

const getAllBooks = async (req, res) => {
    try {
        const books = await bookService.getAllBooks();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { getAllBooks };