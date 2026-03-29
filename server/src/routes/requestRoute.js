import express from 'express'
import borrowController from "../controllers/borrowController.js"
import exchangeController from "../controllers/exchangeController.js"
const router = express.Router();

router.post("/borrow", borrowController.createBorrow)
router.post("/exchange", exchangeController.createExchange)

export default router