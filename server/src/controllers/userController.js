import userService from "../services/userService.js";
import { sendServiceError } from "../utils/httpError.js";

const UserController = {
    async getWishlist(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const wishlist = await userService.getWishlist(userId);
            return res.status(200).json(wishlist);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async updateWishlist(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { bookId } = req.params;
            const wishlist = await userService.updateWishlist(userId, bookId);
            return res.status(200).json(wishlist);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getPublicProfile(req, res) {
        try {
            const { id } = req.params;
            const profile = await userService.getPublicProfile(id);
            return res.status(200).json(profile);
        } catch (error) {
            return sendServiceError(res, error);
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
            return sendServiceError(res, error);
        }
    },
};
export default UserController;
