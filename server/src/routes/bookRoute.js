import express from 'express'
import bookController from "../controllers/bookController.js"
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post('/', requireAuth, bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/user/:userId', bookController.findBooksByUserId);
router.get('/search', bookController.searchBooks);

export default router