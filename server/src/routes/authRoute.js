import express from "express";
import authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.get("/me/stats", requireAuth, authController.getMyStats);
router.patch("/me", requireAuth, authController.updateMe);

export default router;
