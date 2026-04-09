import express from 'express'
import bookController from "../controllers/bookController.js"
import { requireAuth } from "../middleware/auth.js";
import uploadImage from "../middleware/uploadImage.js";

const router = express.Router();

router.post('/', requireAuth, uploadImage, bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/meta/genres', bookController.getBookGenres);
router.get('/me', requireAuth, bookController.findBooksByUserId);
router.get('/user/:userId', bookController.findBooksByUserId);
router.get('/search', bookController.searchBooks);
router.post('/:bookId/toggle-availability', requireAuth, bookController.toggleAvailability);
router.get('/:bookId', bookController.getBookByBookId);

router.patch('/:bookId', requireAuth, uploadImage, bookController.updateDetails);
router.delete('/:bookId', requireAuth, bookController.deleteBook);

export default router
