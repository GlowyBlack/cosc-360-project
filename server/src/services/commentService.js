import messageRepository from "../repositories/messageRepository.js";
import requestRepository from "../repositories/requestRepository.js";

function canSendMessagesOnRequest(requestDoc) {
    if (!requestDoc) return false;
    const status = String(requestDoc.status ?? "").trim().toLowerCase();
    const type = String(requestDoc.type ?? "").trim().toLowerCase();

    if (status === "cancelled") return false;
    if (status === "pending") return true;
    if (status === "declined" || status === "returned") return false;

    if (status === "accepted") {
        if (type === "borrow") {
            if (!requestDoc.returnBy) return true;
            return new Date() <= new Date(requestDoc.returnBy);
        }
        return false;
    }

    return false;
}

function isRequestParticipant(requestDoc, userId) {
    if (!requestDoc || userId == null) return false;
    const u = String(userId);
    return (
        String(requestDoc.bookOwner) === u || String(requestDoc.requesterId) === u
    );
}

const messageService = {
    async assertThreadAccess(requestId, userId) {
        const reqDoc = await requestRepository.findRequestById({ id: requestId });
        if (!reqDoc) {
            const err = new Error("Request not found");
            err.statusCode = 404;
            throw err;
        }
        if (!isRequestParticipant(reqDoc, userId)) {
            const err = new Error("Not allowed to access this thread");
            err.statusCode = 403;
            throw err;
        }
        return reqDoc;
    },

    async getThread(requestId, userId) {
        await this.assertThreadAccess(requestId, userId);
        return messageRepository.findByRequestId(requestId);
    },

    async send({ requestId, senderId, content }) {
        if (!content || !content.trim()) {
            throw new Error("Message content cannot be empty");
        }
        const reqDoc = await this.assertThreadAccess(requestId, senderId);
        if (!canSendMessagesOnRequest(reqDoc)) {
            const err = new Error("Messaging is closed for this request");
            err.statusCode = 403;
            throw err;
        }
        const created = await messageRepository.create({ requestId, senderId, content });
        return messageRepository.findByIdWithSender(created._id);
    },

    async markAsRead(requestId, readerId) {
        await this.assertThreadAccess(requestId, readerId);
        return messageRepository.markIncomingAsRead(requestId, readerId);
    },

    async getInbox(userId) {
        if (!userId) throw new Error("User ID is required");
        const requests = await requestRepository.findUserRequests(userId);
        const requestIds = requests.map((r) => r._id);
        const summaries = await messageRepository.findLastMessageAndUnreadCountPerRequest(
            requestIds,
            userId,
        );
        const byRequestId = new Map(
            summaries.map((row) => [String(row._id), row]),
        );

        const threads = requests.map((reqDoc) => {
            const idStr = String(reqDoc._id);
            const row = byRequestId.get(idStr);
            return {
                requestId: idStr,
                request: reqDoc,
                lastMessagePreview: row?.lastContent ?? null,
                lastMessageAt: row?.lastCreatedAt ?? null,
                unreadCount: row?.unreadCount ?? 0,
            };
        });

        threads.sort((a, b) => {
            const ta = a.lastMessageAt
                ? new Date(a.lastMessageAt).getTime()
                : 0;
            const tb = b.lastMessageAt
                ? new Date(b.lastMessageAt).getTime()
                : 0;
            if (tb !== ta) return tb - ta;
            const ua = new Date(
                a.request.updatedAt ?? a.request.createdAt,
            ).getTime();
            const ub = new Date(
                b.request.updatedAt ?? b.request.createdAt,
            ).getTime();
            return ub - ua;
        });

        return { threads };
    },
};

export default messageService;
