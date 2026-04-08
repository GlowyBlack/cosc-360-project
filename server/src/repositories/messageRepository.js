import mongoose from "mongoose";
import Message from "../models/message.js";

function ensureObjectId(id) {
    if (id instanceof mongoose.Types.ObjectId) return id;
    return new mongoose.Types.ObjectId(String(id));
}

const MessageRepository = {
    // fetch every message for a given requestId, oldest first
    async findByRequestId(requestId) {
        return Message.find({ requestId })
            .populate({ path: "senderId", select: "username profileImage" })
            .sort({ createdAt: 1 });
    },

    async findByIdWithSender(messageId) {
        return Message.findById(messageId)
            .populate({ path: "senderId", select: "username profileImage" })
            .exec();
    },

    // insert a single new message document
    async create(data) {
        const message = new Message(data);
        return message.save();
    },

    // Marks messages the reader received (not sent by them) as read.
    async markIncomingAsRead(requestId, readerId) {
        return Message.updateMany(
            { requestId, senderId: { $ne: readerId }, isRead: false },
            { $set: { isRead: true } },
        );
    },

    // find newest message (preview + time) + count of unread messages
    async findLastMessageAndUnreadCountPerRequest(requestIds, readerUserId) {
        if (!requestIds?.length) return [];

        const inTheseRequests = { $match: { requestId: { $in: requestIds.map(ensureObjectId) } } };
        const newestFirst = { $sort: { createdAt: -1 } };
        const readerId = ensureObjectId(readerUserId);
        // Unread *for this user* = not written by them, and still isRead: false
        const isUnreadIncoming = {
            $and: [{ $eq: ["$isRead", false] }, { $ne: ["$senderId", readerId] }],
        };

        const oneRowPerRequest = {
            $group: {
                _id: "$requestId",
                lastContent: { $first: "$content" },
                lastCreatedAt: { $first: "$createdAt" },
                unreadCount: { $sum: { $cond: [isUnreadIncoming, 1, 0] } },
            },
        };

        return Message.aggregate([inTheseRequests, newestFirst, oneRowPerRequest]);
    },
};

export default MessageRepository;