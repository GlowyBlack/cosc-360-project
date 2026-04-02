import mongoose from "mongoose";
import { BOOK_GENRES } from "../constants/bookGenres.js";

const BookSchema = new mongoose.Schema({
    bookTitle: {type: String, required: true, trim: true },
    bookAuthor: {type: String, required: true, trim: true },
    bookImage: {type: String, default: null,},
    description: {type: String, default: null, trim: true},
    genre: { type: [String], enum: BOOK_GENRES, default: [] },
    bookOwner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    condition: {type: String, enum: ["Worn", "Fair", "Good", "Like New", "New"], default: "Good"},
    ownerNote: {type: String, default: "", trim: true},
    isAvailable: {type: Boolean, default: true},
    pendingRequestCount: {type: Number, default: 0}
}, { timestamps: true });

export default mongoose.model("Book", BookSchema);

