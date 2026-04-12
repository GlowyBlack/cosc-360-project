import borrowService from "../services/borrowService.js";
import { sendServiceError } from "../utils/httpError.js";

const BorrowController = {
    async createBorrow(req, res) {
        try {
            const { bookId, ownerId, returnBy } = req.body;
            const requesterId = req.user?._id ?? req.user?.id;

            if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
            if (!bookId || !ownerId) return res.status(400).json({ message: "bookId and ownerId are required" });
            if (!returnBy) return res.status(400).json({ message: "A return date is required" });

            const result = await borrowService.initiateBorrow({ requesterId, ownerId, bookId, returnBy });
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async acceptBorrow(req, res) {
        try {
            const requestId = req.params.requestId ?? req.body.requestId;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });
            if (!requestId) return res.status(400).json({ message: "requestId is required" });

            const result = await borrowService.acceptBorrow({ requestId, userId });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async declineBorrow(req, res) {
        try {
            const requestId = req.params.requestId ?? req.body.requestId;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });
            if (!requestId) return res.status(400).json({ message: "requestId is required" });

            const result = await borrowService.declineBorrow({ requestId, userId });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async markBorrowReturned(req, res) {
        try {
            const requestId = req.params.requestId ?? req.body.requestId;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });
            if (!requestId) return res.status(400).json({ message: "requestId is required" });

            const result = await borrowService.markBorrowReturned({ requestId, userId });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },
};

export default BorrowController;
