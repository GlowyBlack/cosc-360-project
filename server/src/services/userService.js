import mongoose from "mongoose";
import userRepository from "../repositories/userRepository.js";
import bookRepository from "../repositories/bookRepository.js";
import requestRepository from "../repositories/requestRepository.js";

const UserService = {
    async getWishlist(userId) {
        if (!userId) throw new Error("User ID is required");

        const wishlist = await userRepository.findWishlistByUserId(userId);
        if (!wishlist) throw new Error("User not found");

        return wishlist;
    },

    async updateWishlist(userId, bookId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const book = await bookRepository.findByID({ id: bookId });
        if (!book) throw new Error("Book not found");
        const ownerId = String(book.bookOwner?._id ?? book.bookOwner ?? "");
        if (ownerId === String(userId)) {
            throw new Error("You can't add your own book to your wishlist");
        }

        return await userRepository.updateWishlist(userId, bookId);
    },

    async getPublicProfile(userId) {
        if (!userId || !mongoose.isValidObjectId(String(userId))) {
            throw new Error("Invalid user id");
        }
        const user = await userRepository.findPublicById(userId);
        if (!user) throw new Error("User not found");
        if (user.isSuspended) throw new Error("User not found");

        const [booksBorrowed, inLibrary] = await Promise.all([
            requestRepository.countCompletedBorrowsAsBorrower(userId),
            bookRepository.countByOwner(userId),
        ]);

        return {
            id: user._id,
            username: user.username,
            bio: user.bio ?? "",
            profileImage: user.profileImage ?? null,
            location: user.location ?? "",
            stats: {
                booksBorrowed,
                inLibrary,
                rating: null,
            },
        };
    },

    async getAvailableBooksPaginated(userId, { page = 1, limit = 8 } = {}) {
        if (!userId || !mongoose.isValidObjectId(String(userId))) {
            throw new Error("Invalid user id");
        }
        const user = await userRepository.findPublicById(userId);
        if (!user) throw new Error("User not found");
        if (user.isSuspended) throw new Error("User not found");

        const p = Math.max(1, Number(page) || 1);
        const rawLimit = Number(limit) || 8;
        const l = Math.min(24, Math.max(1, rawLimit));
        const skip = (p - 1) * l;

        const [total, books] = await Promise.all([
            bookRepository.countAvailableByOwner(userId),
            bookRepository.findAvailableByOwnerPaginated(userId, { skip, limit: l }),
        ]);

        const totalPages = total < 1 ? 0 : Math.ceil(total / l);

        return {
            books,
            page: p,
            limit: l,
            total,
            totalPages,
        };
    },
};

export default UserService;
