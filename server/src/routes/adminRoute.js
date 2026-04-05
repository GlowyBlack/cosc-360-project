import express from "express";
import adminController from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/users", requireAuth, requireAdmin, adminController.listUsers);
router.get(
  "/users/search",
  requireAuth,
  requireAdmin,
  adminController.searchUsers
);
router.get("/books", requireAuth, requireAdmin, adminController.getBooks);
router.put(
  "/users/:id/suspend",
  requireAuth,
  requireAdmin,
  adminController.suspendUser
);
router.put(
  "/users/:id/unsuspend",
  requireAuth,
  requireAdmin,
  adminController.unsuspendUser
);
router.put("/users/:id/ban", requireAuth, requireAdmin, adminController.banUser);
router.delete(
  "/books/:id",
  requireAuth,
  requireAdmin,
  adminController.deleteBook
);

export default router;
