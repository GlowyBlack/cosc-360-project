import mongoose from "mongoose";

const BookSchema = new mongoose.Schema({
    bookTitle: {type: String, required: true, trim: true },
    bookAuthor: {type: String, required: true, trim: true },
    bookImage: {type: String, default: null,},
    description: {type: String, default: null, trim: true},
    genre: {type: [String], 
        enum: [  "Action",  "Adventure",   "Biography",  "Fantasy",  "Fiction",  "Graphic Novel",
                  "Historical Fiction",  "Horror",  "Mystery",  "Non-Fiction",  "Romance",
                  "Sci-Fi",  "Thriller",  "Young Adult"
        ], 
        default: []},
    bookOwner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    condition: {type: String, enum: ["Worn", "Fair", "Good", "Like New", "New"], default: "Good"},
    onwerNote: {type: String, default: "", trim: true},
    isAvailable: {type: Boolean, default: true},
    pendingRequestCount: {type: Number, default: 0}
}, { timestamps: true });

export default mongoose.model("Book", BookSchema);
