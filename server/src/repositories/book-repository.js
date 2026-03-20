import Book from "../models/book.js";

const BookRepository = {
    async createBook(data) {
        return await Book.create(data);
    },

    async findAll() {
        return await Book.find().sort({ createdAt: -1 });
    },

    async findUserBooks(userID) {
        return await Book.find({ book_owner: userID }).sort({ createdAt: -1 });
    },
};
export default BookRepository;
