import bookRepository from "../repositories/bookRepository.js"
import fs from "fs";

const BookService = {
    async getAllBooks() {
        return await bookRepository.findAll();
    },

    async createBook(data) {
        const bookTitle = String(data.bookTitle ?? "").trim();
        const bookAuthor = String(data.bookAuthor ?? "").trim();
        if (!bookTitle || !bookAuthor) throw new Error("Title and author are required");

        const description = String(data.description ?? "").trim();
        if (!description) throw new Error("Please provide the summary of the book");
        
        const rawGenre = data.genre ?? data.genres;
        const genre = Array.isArray(rawGenre)
            ? rawGenre.map((g) => String(g).trim()).filter(Boolean)
            : [];

        if (genre.length < 1) throw new Error("Select at least one genre");

        const bookOwner = data.bookOwner;
        if (!bookOwner) throw new Error("Book owner is required");

        const doc = {
            bookTitle,
            bookAuthor,
            description,
            genre,
            bookOwner,
            bookImage:
                data.bookImage != null && data.bookImage !== ""
                    ? String(data.bookImage)
                    : null,
            condition: data.condition ?? "Good",
            ownerNote: String(data.ownerNote ?? "").trim(),
            isAvailable: data.isAvailable !== false,
        };

        return await bookRepository.createBook(doc);
    },

    async findBooksByUserId(userID) {
        if (!userID) throw new Error("User ID is required");

        return await bookRepository.findUserBooks(userID);
    },


    async getBookByBookId(bookId) {
        if (!bookId) throw new Error("Book ID is required");

        return await bookRepository.findByID({id: bookId, lean: true });
    },

    async updateDetails(bookId, userId, body) {
        if (!bookId) throw new Error("Book ID is required.");
        if (!userId) throw new Error("User ID is required");

        const existing = await bookRepository.findByID({id: bookId});
        if (!existing) throw new Error("Book not found");

        const ownerId = String(existing.bookOwner?._id ?? existing.bookOwner);
        if (!ownerId.equals(userId)) throw new Error("You can't edit a book that doesn't belong to you.");

        const updates = {};
        if (body.bookTitle != null) updates.bookTitle = String(body.bookTitle).trim();
        if (body.bookAuthor != null) updates.bookAuthor = String(body.bookAuthor).trim();
        if (body.description != null) updates.description = String(body.description).trim();

        if (Array.isArray(body.genre)) {
            updates.genre = body.genre
                .map((g) => String(g).trim())
                .filter(Boolean);
        }
        if (body.condition != null) updates.condition = body.condition;
        if (body.ownerNote != null) updates.ownerNote = String(body.ownerNote).trim();

        if (body.bookImage !== undefined) {
            updates.bookImage =
                body.bookImage === "" || body.bookImage == null
                    ? null
                    : String(body.bookImage);
        }
        if (body.isAvailable !== undefined) updates.isAvailable = Boolean(body.isAvailable);
        return await bookRepository.updateBook(bookId, updates);
    },

    async deleteBook(bookId, userId) {
        if (!bookId) throw new Error("Book ID is required");
        const book = await bookRepository.findByID({id: bookId});
        if (!book) throw new Error("Book not found");

        const ownerId = String(book.bookOwner?._id ?? book.bookOwner);
        if (ownerId !== String(userId)  /* or if not admin */) {
            throw new Error("You can't delete a book that doesn't belong to you.");
        }

        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                await bookRepository.deleteBook(bookId, session);

                await requestRepository.cancelAllRequestsForBook(bookId, session);
            });
            return { success: true, message: "Book and associated requests cancelled." };
        }catch{
            console.error("Deletion/Cancellation transaction failed:", error);
            throw error;
        }finally{
            session.endSession();
        }
    },

    async searchBooks(searchTerm) {
        const raw = String(searchTerm ?? "").trim()
        if(!raw) return this.getAllBooks();
        
        return await bookRepository.searchBook(raw);
    },
};
export default BookService;
