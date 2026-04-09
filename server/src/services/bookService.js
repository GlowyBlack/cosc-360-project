import bookRepository from "../repositories/bookRepository.js"
import fs from "fs";

function normalizeGenreInput(rawGenre) {
    if (Array.isArray(rawGenre)) {
        return rawGenre.map((g) => String(g).trim()).filter(Boolean);
    }
    if (rawGenre == null) return [];
    const one = String(rawGenre).trim();
    if (!one) return [];
    if (one.includes(",")) {
        return one.split(",").map((g) => g.trim()).filter(Boolean);
    }
    return [one];
}

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
        const genre = normalizeGenreInput(rawGenre);

        if (genre.length < 1) throw new Error("Select at least one genre");

        const bookOwner = data.bookOwner;
        if (!bookOwner) throw new Error("Book owner is required");

        const image = String(data.bookImage ?? "").trim();
        if (!image) throw new Error("Book cover image is required");

        const doc = {
            bookTitle,
            bookAuthor,
            description,
            genre,
            bookOwner,
            bookImage: image,
            condition: data.condition ?? "Good",
            ownerNote: String(data.ownerNote ?? "").trim(),
            isAvailable: String(data.isAvailable ?? "true") !== "false",
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
        if (ownerId !== String(userId)) throw new Error("You can't edit a book that doesn't belong to you.");

        const updates = {};
        if (body.bookTitle != null) updates.bookTitle = String(body.bookTitle).trim();
        if (body.bookAuthor != null) updates.bookAuthor = String(body.bookAuthor).trim();
        if (body.description != null) updates.description = String(body.description).trim();

        if (body.genre !== undefined) {
            updates.genre = normalizeGenreInput(body.genre);
        }
        if (body.condition != null) updates.condition = body.condition;
        if (body.ownerNote != null) updates.ownerNote = String(body.ownerNote).trim();

        if (body.bookImage !== undefined) {
            const nextImage = String(body.bookImage ?? "").trim();
            if (!nextImage) throw new Error("Book cover image is required");
            updates.bookImage = nextImage;
        }
        if (body.isAvailable !== undefined) {
            updates.isAvailable = String(body.isAvailable) !== "false";
        }
        if (updates.bookImage === undefined) {
            const existingImage = String(existing.bookImage ?? "").trim();
            if (!existingImage) throw new Error("Book cover image is required");
        }
        return await bookRepository.updateBook(bookId, updates);
    },
    

    async toggleAvailability(bookId, userId) {
        if (!bookId) throw new Error("Book ID is required.");
        if (!userId) throw new Error("User ID is required");

        const existing = await bookRepository.findByID({ id: bookId });
        if (!existing) throw new Error("Book not found");

        const ownerId = String(existing.bookOwner?._id ?? existing.bookOwner);
        if (ownerId !== String(userId)) throw new Error("You can't change availability for a book that doesn't belong to you.");

        const updated = await bookRepository.toggleAvailability({ bookId });
        if (!updated) throw new Error("Book not found");
        return updated;
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
