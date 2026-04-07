import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    content:  { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isRemoved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Comment", CommentSchema);