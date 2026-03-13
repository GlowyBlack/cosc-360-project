import mongoose from "mongoose";
import {v4 as uuidv4} from 'uuid';

const BookSchema = new mongoose.Schema({
    _id: {type: String, default: uuidv4},
    book_title: {type: String, default: null },
    book_author: {type: String, default: null },
    book_image: {type: String, default: null},
    book_owner: {type: String, default: null},
    is_available: {type: Boolean, default: false},
});

const Book = mongoose.model('Book', BookSchema);
export default {Book}