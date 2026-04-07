import express from "express";
import { requireAuth } from "../middleware/auth.js";
import reviewController from "../controllers/reviewController.js";

const router = express.Router();

router.get("/user/:userId", reviewController.getReviewsForUser);
router.get("/request/:requestId", reviewController.getReviewsForRequest);
router.get("/eligibility/:requestId", requireAuth, reviewController.getEligibility);
router.post("/", requireAuth, reviewController.createReview);

export default router;
