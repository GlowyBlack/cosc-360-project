import messageService from "../services/messageService.js";
 
const messageController = {
    // GET /messages/inbox
    async getInbox(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            const inbox = await messageService.getInbox(userId);
            return res.status(200).json(inbox);
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    },

    // GET /messages/:requestId
    async getThread(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { requestId } = req.params;
            const messages = await messageService.getThread(requestId, userId);
            return res.status(200).json(messages);
        } catch (e) {
            const code = e.statusCode ?? 500;
            if (code === 404 || code === 403) {
                return res.status(code).json({ message: e.message });
            }
            return res.status(500).json({ message: e.message });
        }
    },

    // POST /messages
    // body: { requestId, content }
    async send(req, res) {
        try {
            const { requestId, content } = req.body;
            const senderId = req.user?._id ?? req.user?.id;
            const message = await messageService.send({ requestId, senderId, content });
            return res.status(201).json(message);
        } catch (e) {
            if (e.message.toLowerCase().includes("not found"))
                return res.status(404).json({message: e.message})
            if (e.message.toLowerCase().includes("not allowed"))
                return res.status(403).json({message: e.message})
            
            const code = e.statusCode;
            if (code === 404 || code === 403) {
                return res.status(code).json({ message: e.message });
            }
            return res.status(400).json({ message: e.message });
        }
    },

    // PATCH /messages/:requestId/read
    async markAsRead(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { requestId } = req.params;
            await messageService.markAsRead(requestId, userId);
            return res.status(200).json({ success: true });
        } catch (e) {
            const code = e.statusCode ?? 500;
            if (code === 404 || code === 403) {
                return res.status(code).json({ message: e.message });
            }
            return res.status(500).json({ message: e.message });
        }
    },
};

export default messageController;