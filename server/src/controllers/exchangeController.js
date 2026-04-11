import exchangeService from "../services/exchangeService.js";
import { sendServiceError } from "../utils/httpError.js";

const ExchangeController = {
    async createExchange(req, res) {
        try {
            const { bookId, ownerId, offeredBookId } = req.body;
            const requesterId = req.user?._id ?? req.user?.id;

            if (!requesterId) return res.status(401).json({ message: "Unauthorized" });

            if (!bookId || !ownerId) return res.status(400).json({ message: "bookId and ownerId are required" });

            if (!offeredBookId) return res.status(400).json({ message: "Offered book is required for exchange" });

            const result = await exchangeService.initiateExchange({
                requesterId,
                ownerId,
                bookId,
                offeredBookId,
            });
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async editExchange(req, res) {
        try {
            const { requestId: bodyRequestId, offeredBookId } = req.body;
            const paramId = req.params.requestId;
            const id = bodyRequestId ?? paramId;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });
            if (!id) return res.status(400).json({ message: "requestId is required" });
            if (!offeredBookId) {
                return res.status(400).json({ message: "offeredBookId is required" });
            }

            const result = await exchangeService.editExchangeOfferedBook({
                requestId: id,
                userId,
                offeredBookId,
            });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async acceptExchange(req, res) {
        try {
            const { requestId } = req.body;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            if (!requestId) return res.status(400).json({ message: "requestId is required" });
            const result = await exchangeService.acceptExchange({ requestId, userId });

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async declineExchange(req, res) {
        try {
            const { requestId } = req.body;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            if (!requestId) return res.status(400).json({ message: "requestId is required" });
            const result = await exchangeService.declineExchange({ requestId, userId });

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async cancelExchange(req, res) {
        try {
            const { requestId } = req.body;
            const paramId = req.params.requestId;
            const id = requestId ?? paramId;
            const userId = req.user?._id ?? req.user?.id;

            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            if (!id) return res.status(400).json({ message: "requestId is required" });
            const result = await exchangeService.cancelExchange({ requestId: id, userId });

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },
};

export default ExchangeController;
