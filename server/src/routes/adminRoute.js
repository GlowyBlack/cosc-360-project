import express from "express";
import adminController from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/users", requireAuth, requireAdmin, adminController.listUsers);
router.get("/users/search", requireAuth, requireAdmin, adminController.searchUsers);
router.get("/books", requireAuth, requireAdmin, adminController.getBooks);
router.put("/users/:id/suspend", requireAuth, requireAdmin, adminController.suspendUser);
router.put("/users/:id/unsuspend", requireAuth, requireAdmin, adminController.unsuspendUser);
router.put("/users/:id/ban", requireAuth, requireAdmin, adminController.banUser);
router.put("/users/:id/unban", requireAuth, requireAdmin, adminController.unbanUser);
router.delete("/books/:id", requireAuth, requireAdmin, adminController.deleteBook);
router.get("/posts", requireAuth, requireAdmin, adminController.listPosts);
router.put("/posts/:id/remove", requireAuth, requireAdmin, adminController.removePost);
router.put("/posts/:id/restore", requireAuth, requireAdmin, adminController.restorePost);

export default router;
