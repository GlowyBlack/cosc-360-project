import mongoose from "mongoose";
// import {v4 as uuidv4} from 'uuid';

const BookSchema = new mongoose.Schema({
    book_title: {type: String, required: true },
    book_author: {type: String, required: true },
    book_image: {type: String, default: null},
    description: {type: String, default: null},
    genre: {type: String, 
        enum: ["Fiction", "Non-Fiction", "Sci-Fi", "Fantasy", "Mystery", "Biography", "Romance", "Action", ], 
        default: null},
    // book_owner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    book_owner: {type: String, required: true},
    condition: {type: String, enum: ["Worn", "Fair", "Good", "Like New", "New"], default: "Good"},
    is_available: {type: Boolean, default: false},
}, { timestamps: true });

export default mongoose.model("Book", BookSchema);