import messageService from "../services/messageService.js";
 
const messageController = {
    // GET /messages/:requestId
    async getThread(req, res) {
        try {
            const { requestId } = req.params;
            const messages = await messageService.getThread(requestId);
            return res.status(200).json(messages);
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    },
 
    // POST /messages
    // body: { requestId, content }
    async send(req, res) {
        try {
            const { requestId, content } = req.body;
            const senderId = req.user._id; // comes from requireAuth middleware (JWT)
            const message = await messageService.send({ requestId, senderId, content });
            return res.status(201).json(message);
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }
    },
 
    // PATCH /messages/:requestId/read
    async markAsRead(req, res) {
        try {
            const { requestId } = req.params;
            await messageService.markAsRead(requestId);
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    },
};
 
export default messageController;