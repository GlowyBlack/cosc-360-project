import user from "../models/user.js";
import bookRepository from "../repositories/bookRepository.js"
import fs from "fs";

const BookService = {
    async getAllBooks() {
        return await bookRepository.findAll();
    },

    async createBook(data) {
        if (!data.book_title || !data.book_author) {
            throw new Error("Title and author are required");
        }
        if(!data.description){
            throw new Error("Please provide the summary of the book");
        }

        return await bookRepository.createBook(data);
    },

    async findBooksByUserId(userID) {
        if (!userID) {
            throw new Error("User ID is required");
        }
        return await bookRepository.findUserBooks(userID);
    },


    async getBookByBookId(id) {
        if (!id) {
            throw new Error("Book ID is required");
        }
        return await bookRepository.findByID(id);
    },

    async updateDetails(data) {
        if(!data.id){
            throw new Error("Book ID is required.");
        }
        if(!data.userId) {
            throw new Error("User ID is required");
        }
        const book = bookRepository.findByID(id);
        if(book.bookOwner != data.userId){
            throw new Error("You can't edit a book that doesn't belong to you.");
        }
        const { id } = data;
        return await bookRepository.updateBook(data, id);
    },

    async deleteBook(bookId, userId){
        if (!bookId) {
            throw new Error("Book ID is required");
        }
        const book = bookRepository.findByID(bookId);
        if(book.bookOwner != userId /* or if not admin */){
            throw new Error("You can't edit a book that doesn't belong to you.");
        }
        return await bookRepository.delete(bookId);
    },

    searchBooksFromMock(searchTerm) {
        const normalizedTerm = String(searchTerm ?? "").trim().toLowerCase();
        const filePath = new URL("../mock/books.json", import.meta.url);
        const mockBooks = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (!normalizedTerm) {
            return mockBooks;
        }

        return mockBooks.filter((book) => {
            const haystack = [
                book.title,
                book.author,
                book.genre,
                book.description,
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(normalizedTerm);
        });
    },

};
export default BookService;