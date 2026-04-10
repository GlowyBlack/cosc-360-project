import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    content:  { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isRemoved: { type: Boolean, default: false },
}, { timestamps: true });

CommentSchema.index({ postId: 1, createdAt: 1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model("Comment", CommentSchema);