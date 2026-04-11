import messageRepository from "../repositories/messageRepository.js";
import requestRepository from "../repositories/requestRepository.js";
import { httpError } from "../utils/httpError.js";

function isRequestParticipant(requestDoc, userId) {
    if (!requestDoc || userId == null) return false;
    const u = String(userId);
    return (
        String(requestDoc.bookOwner) === u || String(requestDoc.requesterId) === u
    );
}

const messageService = {
    async assertThreadAccess(requestId, userId) {
        const request = await requestRepository.findRequestById({ id: requestId });
        if (!request) {
            throw httpError(404, "Request not found");
        }
        if (!isRequestParticipant(request, userId)) {
            throw httpError(403, "Not allowed to access this thread");
        }
        return request;
    },

    async getThread(requestId, userId) {
        await this.assertThreadAccess(requestId, userId);
        return messageRepository.findByRequestId(requestId);
    },

    async send({ requestId, senderId, content }) {
        if (!content || !content.trim()) {
            throw httpError(400, "Message content cannot be empty");
        }
        await this.assertThreadAccess(requestId, senderId);
        const created = await messageRepository.create({ requestId, senderId, content });
        return messageRepository.findByIdWithSender(created._id);
    },

    async markAsRead(requestId, readerId) {
        await this.assertThreadAccess(requestId, readerId);
        return messageRepository.markIncomingAsRead(requestId, readerId);
    },

    async getInbox(userId) {
        if (!userId) throw httpError(400, "User ID is required");
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
