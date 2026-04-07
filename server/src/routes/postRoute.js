import express from "express";
import postController from "../controllers/postController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", postController.getAllPosts);
router.get("/user/:userId", postController.getPostsByUserId);
router.get("/:postId", postController.getPostById);

router.post("/", requireAuth, postController.createPost);
router.patch("/:postId", requireAuth, postController.updatePost);
router.delete("/:postId", requireAuth, postController.deletePost);
router.patch("/:postId/like", requireAuth, postController.toggleLike);

export default router;
