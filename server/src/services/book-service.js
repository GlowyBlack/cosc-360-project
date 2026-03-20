import BookRepository from "../repositories/book-repository.js"

const BookService = {
    async getAllBooks() {
        return await BookRepository.findAll();
    },

    async createBook(data) {
        if (!data.book_title || !data.book_author) {
            throw new Error("Title and author are required");
        }
        return await BookRepository.createBook(data);
    },

    async findBooksByUserId(userID) {
        if (!userID) {
            throw new Error("User ID is required");
        }
        return await BookRepository.findUserBooks(userID);
    },
};

export default BookService;