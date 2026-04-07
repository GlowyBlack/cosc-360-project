import mongoose from "mongoose";
import { BOOK_GENRES } from "../constants/bookGenres.js";

const BlogSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:    { type: String, required: true, trim: true },
    content:  { type: String, required: true, trim: true },
    genre:    { type: [String], enum: BOOK_GENRES, default: [] },
    bookTag:  {
        title:  { type: String, trim: true, default: null },
        author: { type: String, trim: true, default: null },
    },
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isRemoved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Blog", BlogSchema);