import Message from "../models/message.js";
 
const messageRepository = {
    // fetch every message for a given requestId, oldest first
    async findByRequestId(requestId) {
        return Message.find({ requestId }).sort({ createdAt: 1 });
    },
 
    // insert a single new message document
    async create(data) {
        const message = new Message(data);
        return message.save();
    },
 
    // set isRead: true on every message in this thread
    async markThreadAsRead(requestId) {
        return Message.updateMany({ requestId }, { $set: { isRead: true } });
    },
};
 
export default messageRepository;