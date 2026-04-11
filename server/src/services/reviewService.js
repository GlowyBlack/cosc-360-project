import reviewRepository from "../repositories/reviewRepository.js";
import requestRepository from "../repositories/requestRepository.js";
import userRepository from "../repositories/userRepository.js";
import { httpError } from "../utils/httpError.js";

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
        const rt = String(request.type ?? "").toLowerCase();
        const status = String(request.status ?? "");
        const canReview =
            (rt === "borrow" && status === "Returned") ||
            (rt === "exchange" && status === "Accepted");
        if (!canReview) {
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
            throw httpError(404, "Request not found");
        }
        if (!isParticipant(request, reviewerId)) {
            throw httpError(403, "Not allowed to review this request");
        }
        const rt = String(request.type ?? "").toLowerCase();
        const st = String(request.status ?? "");
        const canReview =
            (rt === "borrow" && st === "Returned") ||
            (rt === "exchange" && st === "Accepted");
        if (!canReview) {
            throw httpError(400, "Request is not in a state that allows reviews");
        }
        const revieweeId = otherPartyId(request, reviewerId);
        if (!revieweeId) {
            throw httpError(400, "Could not determine reviewee");
        }
        const existing = await reviewRepository.findByRequestAndReviewer(
            requestId,
            reviewerId,
        );
        if (existing) {
            throw httpError(409, "You already submitted a review for this request");
        }
        const r = Number(rating);
        if (!Number.isFinite(r) || r < 1 || r > 5) {
            throw httpError(400, "Rating must be between 1 and 5");
        }
        const created = await reviewRepository.create({
            requestId,
            reviewerId,
            revieweeId,
            rating: r,
            comment: comment != null ? String(comment).trim() : "",
        });
        const revieweeUserId = revieweeId?._id ?? revieweeId;
        await userRepository.incrementReviewStats(revieweeUserId, r);
        return created;
    },
};

export default ReviewService;
