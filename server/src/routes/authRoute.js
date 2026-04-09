import express from "express";
import authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import uploadImage from "../middleware/uploadImage.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.get("/me/stats", requireAuth, authController.getMyStats);
router.patch("/me", requireAuth, authController.updateMe);
router.post("/me/image", requireAuth, uploadImage, authController.uploadMyImage);

export default router;
