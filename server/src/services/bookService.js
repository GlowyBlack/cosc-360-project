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