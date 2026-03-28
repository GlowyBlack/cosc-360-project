import mongoose from "mongoose";
// import {v4 as uuidv4} from 'uuid';

const BookSchema = new mongoose.Schema({
    bookTitle: {type: String, required: true },
    bookAuthor: {type: String, required: true },
    bookImage: {type: String, default: null},
    description: {type: String, default: null},
    genre: {type: String, 
        enum: [  "Action",  "Adventure",   "Biography",  "Fantasy",  "Fiction",  "Graphic Novel",
                  "Historical Fiction",  "Horror",  "Mystery",  "Non-Fiction",  "Romance",
                  "Sci-Fi",  "Thriller",  "Young Adult"
        ], 
        default: null},
    bookOwner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    // bookOwner: {type: String, required: true},
    condition: {type: String, enum: ["Worn", "Fair", "Good", "Like New", "New"], default: "Good"},
    isAvailable: {type: Boolean, default: false},
}, { timestamps: true });

export default mongoose.model("Book", BookSchema);
