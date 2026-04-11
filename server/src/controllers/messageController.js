import messageService from "../services/messageService.js";
import { sendServiceError } from "../utils/httpError.js";

const messageController = {
    async getInbox(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            const inbox = await messageService.getInbox(userId);
            return res.status(200).json(inbox);
        } catch (e) {
            return sendServiceError(res, e);
        }
    },

    async getThread(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { requestId } = req.params;
            const messages = await messageService.getThread(requestId, userId);
            return res.status(200).json(messages);
        } catch (e) {
            return sendServiceError(res, e);
        }
    },

    async send(req, res) {
        try {
            const { requestId, content } = req.body;
            const senderId = req.user?._id ?? req.user?.id;
            const message = await messageService.send({ requestId, senderId, content });
            return res.status(201).json(message);
        } catch (e) {
            return sendServiceError(res, e);
        }
    },

    async markAsRead(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { requestId } = req.params;
            await messageService.markAsRead(requestId, userId);
            return res.status(200).json({ success: true });
        } catch (e) {
            return sendServiceError(res, e);
        }
    },
};

export default messageController;
