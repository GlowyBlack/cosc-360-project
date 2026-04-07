import reviewRepository from "../repositories/reviewRepository.js";
import requestRepository from "../repositories/requestRepository.js";

const REVIEWABLE_STATUSES = ["Accepted", "Returned"];

function isParticipant(request, userId) {
    if (!request || userId == null) return false;
    const u = String(userId);
    return (
        String(request.bookOwner) === u || String(request.requesterId) === u
    );
}

function otherPartyId(request, userId) {
    const u = String(userId);
    if (String(request.bookOwner) === u) return request.requesterId;
    if (String(request.requesterId) === u) return request.bookOwner;
    return null;
}

const ReviewService = {
    async getReviewsForUser(userId) {
        return await reviewRepository.findByRevieweeId(userId);
    },

    async getReviewsForRequest(requestId) {
        return await reviewRepository.findByRequestId(requestId);
    },

    async getEligibility(requestId, userId) {
        const request = await requestRepository.findRequestById({ id: requestId });
        if (!request) {
            return { eligible: false, reason: "request_not_found" };
        }
        if (!isParticipant(request, userId)) {
            return { eligible: false, reason: "not_participant" };
        }
        const status = String(request.status ?? "");
        if (!REVIEWABLE_STATUSES.includes(status)) {
            return { eligible: false, reason: "request_not_reviewable" };
        }
        const existing = await reviewRepository.findByRequestAndReviewer(
            requestId,
            userId,
        );
        if (existing) {
            return { eligible: false, reason: "already_reviewed", review: existing };
        }
        const revieweeId = otherPartyId(request, userId);
        return {
            eligible: true,
            revieweeId,
            requestStatus: status,
        };
    },

    async createReview({ requestId, reviewerId, rating, comment }) {
        const request = await requestRepository.findRequestById({ id: requestId });
        if (!request) {
            const err = new Error("Request not found");
            err.statusCode = 404;
            throw err;
        }
        if (!isParticipant(request, reviewerId)) {
            const err = new Error("Not allowed to review this request");
            err.statusCode = 403;
            throw err;
        }
        const status = String(request.status ?? "");
        if (!REVIEWABLE_STATUSES.includes(status)) {
            const err = new Error("Request is not in a state that allows reviews");
            err.statusCode = 400;
            throw err;
        }
        const revieweeId = otherPartyId(request, reviewerId);
        if (!revieweeId) {
            const err = new Error("Could not determine reviewee");
            err.statusCode = 400;
            throw err;
        }
        const existing = await reviewRepository.findByRequestAndReviewer(
            requestId,
            reviewerId,
        );
        if (existing) {
            const err = new Error("You already submitted a review for this request");
            err.statusCode = 409;
            throw err;
        }
        const r = Number(rating);
        if (!Number.isFinite(r) || r < 1 || r > 5) {
            const err = new Error("Rating must be between 1 and 5");
            err.statusCode = 400;
            throw err;
        }
        return reviewRepository.create({
            requestId,
            reviewerId,
            revieweeId,
            rating: r,
            comment: comment != null ? String(comment).trim() : "",
        });
    },
};

export default ReviewService;
