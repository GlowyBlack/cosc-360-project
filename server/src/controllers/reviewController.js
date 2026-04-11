import mongoose from "mongoose";
import reviewService from "../services/reviewService.js";
import { sendServiceError } from "../utils/httpError.js";

const reviewController = {
    async getReviewsForUser(req, res) {
        try {
            const { userId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user id" });
            }
            const reviews = await reviewService.getReviewsForUser(userId);
            return res.status(200).json(reviews);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getReviewsForRequest(req, res) {
        try {
            const { requestId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                return res.status(400).json({ message: "Invalid request id" });
            }
            const reviews = await reviewService.getReviewsForRequest(requestId);
            return res.status(200).json(reviews);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getEligibility(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            const { requestId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                return res.status(400).json({ message: "Invalid request id" });
            }
            const result = await reviewService.getEligibility(requestId, userId);
            return res.status(200).json(result);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async createReview(req, res) {
        try {
            const reviewerId = req.user?._id ?? req.user?.id;
            if (!reviewerId) return res.status(401).json({ message: "Not authenticated" });
            const { requestId, rating, comment } = req.body;
            if (!requestId || !mongoose.Types.ObjectId.isValid(String(requestId))) {
                return res.status(400).json({ message: "Valid requestId is required" });
            }
            const review = await reviewService.createReview({
                requestId,
                reviewerId,
                rating,
                comment,
            });
            return res.status(201).json(review);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ message: "You already submitted a review for this request" });
            }
            return sendServiceError(res, error);
        }
    },
};

export default reviewController;
