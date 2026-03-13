import express from 'express'
const router = express.Router();
import bookController from "../controllers/book-controller.js"

router.get('/', bookController.getAllBooks);


export default router