import express from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import commentController from "../controllers/commentController.js";

const router = express.Router();

router.get("/me", requireAuth, commentController.getMyComments);
router.get("/", optionalAuth, commentController.getComments);
router.post("/", requireAuth, commentController.createComment);
router.patch("/:commentId", requireAuth, commentController.editComment);
router.delete("/:commentId", requireAuth, commentController.deleteComment);
router.patch("/:commentId/like", requireAuth, commentController.toggleLike);
router.patch("/:commentId/dislike", requireAuth, commentController.toggleDislike);

export default router;
