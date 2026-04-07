import Review from "../models/review.js";

const ReviewRepository = {
    /** Reviews written *about* this user (they are the reviewee). */
    async findByRevieweeId(userId) {
        return Review.find({ revieweeId: userId })
            .populate({ path: "reviewerId", select: "username profileImage" })
            .populate({ path: "revieweeId", select: "username profileImage" })
            .sort({ createdAt: -1 });
    },

    async findByRequestId(requestId) {
        return await Review.find({ requestId })
            .populate({ path: "reviewerId", select: "username profileImage" })
            .populate({ path: "revieweeId", select: "username profileImage" })
            .sort({ createdAt: 1 });
    },

    async findByRequestAndReviewer(requestId, reviewerId) {
        return await Review.findOne({ requestId, reviewerId });
    },

    async create(data) {
        return await Review.create(data);
    },

    async findByIdWithUsers(reviewId) {
        return await Review.findById(reviewId)
            .populate({ path: "reviewerId", select: "username profileImage" })
            .populate({ path: "revieweeId", select: "username profileImage" });
    },
};

export default ReviewRepository;
