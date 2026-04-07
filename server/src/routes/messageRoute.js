import express from "express";
import { requireAuth } from "../middleware/auth.js";
import messageController from "../controllers/messageController.js";
 
const router = express.Router();

// all endpoints require the user to be logged in
router.get("/inbox", requireAuth, messageController.getInbox);
router.post("/", requireAuth, messageController.send);
router.get("/:requestId", requireAuth, messageController.getThread);
router.patch("/:requestId/read", requireAuth, messageController.markAsRead);
 
export default router;
 