import express from 'express'
const router = express.Router();
import bookController from "../controllers/book-controller.js"

router.post('/', bookController.createBook)
router.get('/', bookController.getAllBooks);



export default router