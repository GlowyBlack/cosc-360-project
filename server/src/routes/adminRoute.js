import express from "express";
import adminController from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/books", requireAuth, requireAdmin, adminController.getBooks);
router.delete("/books/:id", requireAuth, requireAdmin, adminController.deleteBook);

router.get("/users", requireAuth, requireAdmin, adminController.listUsers);
router.get("/users/search", requireAuth, requireAdmin, adminController.searchUsers);
router.put("/users/:id/suspend", requireAuth, requireAdmin, adminController.suspendUser);
router.put("/users/:id/unsuspend", requireAuth, requireAdmin, adminController.unsuspendUser);
router.put("/users/:id/ban", requireAuth, requireAdmin, adminController.banUser);
router.put("/users/:id/unban", requireAuth, requireAdmin, adminController.unbanUser);

router.get("/posts", requireAuth, requireAdmin, adminController.listPosts);
router.put("/posts/:id/remove", requireAuth, requireAdmin, adminController.removePost);
router.put("/posts/:id/restore", requireAuth, requireAdmin, adminController.restorePost);

router.get("/comments", requireAuth, requireAdmin, adminController.listComments);
router.put("/comments/:id/remove", requireAuth, requireAdmin, adminController.removeComment);
router.put("/comments/:id/restore", requireAuth, requireAdmin, adminController.restoreComment);

router.get("/reports", requireAuth, requireAdmin, adminController.listReports);
router.get("/reports/:reportId", requireAuth, requireAdmin, adminController.getReportById);
router.patch("/reports/:reportId", requireAuth, requireAdmin, adminController.patchReport);
router.put("/reports/:reportId/resolve", requireAuth, requireAdmin, adminController.resolveReport);
router.put("/reports/:reportId/unresolve", requireAuth, requireAdmin, adminController.unresolveReport);

export default router;
