import express from 'express'
import borrowController from "../controllers/borrowController.js"
import exchangeController from "../controllers/exchangeController.js"
import requestController from "../controllers/requestController.js"
import { requireAuth } from "../middleware/auth.js"

const router = express.Router();

router.post("/borrow", requireAuth, borrowController.createBorrow)
router.post("/borrow/:requestId/accept", requireAuth, borrowController.acceptBorrow)
router.post("/borrow/:requestId/decline", requireAuth, borrowController.declineBorrow)

router.post("/exchange", requireAuth, exchangeController.createExchange)
router.patch("/exchange/:requestId", requireAuth, exchangeController.editExchange)
router.post("/exchange/:requestId/accept", requireAuth, exchangeController.acceptExchange)
router.post("/exchange/:requestId/decline", requireAuth, exchangeController.declineExchange)
router.post("/exchange/:requestId/cancel", requireAuth, exchangeController.cancelExchange)

router.get("/", requireAuth, requestController.getAllRequest)
router.get("/me", requireAuth, requestController.getUserRequests)

export default router