import messageRepository from "../repositories/messageRepository.js";

const messageService = {
    async getThread(requestId) {
        return messageRepository.findByRequestId(requestId);
    },

    async send({ requestId, senderId, content }) {
        if (!content || !content.trim()) {
            throw new Error("Message content cannot be empty");
        }
        return messageRepository.create({ requestId, senderId, content });
    },

    async markAsRead(requestId) {
        return messageRepository.markThreadAsRead(requestId);
    },
};

export default messageService;
