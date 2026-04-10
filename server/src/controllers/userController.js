import userService from "../services/userService.js";

const UserController = {
    async getWishlist(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const wishlist = await userService.getWishlist(userId);
            return res.status(200).json(wishlist);
        } catch (error) {
            const msg = error.message;

            if (msg === "User not found") {
                return res.status(404).json({ message: msg });
            }
            if (msg === "User ID is required") {
                return res.status(400).json({ message: msg });
            }
            return res.status(500).json({ message: "Server Error", error: msg });
        }
    },

    async updateWishlist(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { bookId } = req.params;
            const wishlist = await userService.updateWishlist(userId, bookId);
            return res.status(200).json(wishlist);
        } catch (error) {
            const msg = error.message;

            if (msg === "Book not found" || msg == "User not found") {
                return res.status(404).json({ message: msg });
            }
            if (msg === "Book ID is required." || msg === "User ID is required") {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: "Server Error", error: msg });
        }
    },

    async getPublicProfile(req, res) {
        try {
            const { id } = req.params;
            const profile = await userService.getPublicProfile(id);
            return res.status(200).json(profile);
        } catch (error) {
            const msg = error.message;
            if (msg === "Invalid user id") {
                return res.status(400).json({ message: msg });
            }
            if (msg === "User not found") {
                return res.status(404).json({ message: msg });
            }
            return res.status(500).json({ message: "Server Error", error: msg });
        }
    },

    async getUserAvailableBooks(req, res) {
        try {
            const { id } = req.params;
            const page = req.query.page ?? req.query.p;
            const limit = req.query.limit ?? req.query.perPage;
            const data = await userService.getAvailableBooksPaginated(id, { page, limit });
            return res.status(200).json(data);
        } catch (error) {
            const msg = error.message;
            if (msg === "Invalid user id") {
                return res.status(400).json({ message: msg });
            }
            if (msg === "User not found") {
                return res.status(404).json({ message: msg });
            }
            return res.status(500).json({ message: "Server Error", error: msg });
        }
    },
};
export default UserController;
