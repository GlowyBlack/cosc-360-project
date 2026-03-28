import express from 'express'
import bookController from "../controllers/bookController.js"
const router = express.Router();

router.post('/', bookController.createBook)
router.get('/', bookController.getAllBooks);
router.get('/user/:userId', bookController.findBooksByUserId);
router.get('/search', bookController.searchBooks);

export default router