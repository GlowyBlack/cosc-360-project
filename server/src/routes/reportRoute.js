import express from "express";
import reportController from "../controllers/reportController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, reportController.create);
router.get("/me", requireAuth, reportController.listMine);

export default router;
