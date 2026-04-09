import mongoose from "mongoose";
import commentService from "../services/commentService.js";

function parseBoolean(value) {
    if (typeof value === "boolean") return value;
    return String(value ?? "").toLowerCase() === "true";
}

const CommentController = {
    // GET /comments?postId=&showRemoved=true
    async getComments(req, res) {
        try {
            const { postId, showRemoved } = req.query;
            if (!postId || !mongoose.Types.ObjectId.isValid(String(postId))) {
                return res.status(400).json({ message: "Valid postId is required" });
            }

            const comments = await commentService.getComments({
                postId,
                showRemoved: parseBoolean(showRemoved),
                userRole: req.user?.role ?? "Registered",
            });
            return res.status(200).json(comments);
        } catch (error) {
            if (error.message === "postId is required") {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    // POST /comments
    async createComment(req, res) {
        try {
            const authorId = req.user?._id ?? req.user?.id;;
            if (!authorId) return res.status(401).json({ message: "Not authenticated" });

            const { postId, content, parentId } = req.body;
            if (!postId || !mongoose.Types.ObjectId.isValid(String(postId))) {
                return res.status(400).json({ message: "Valid postId is required" });
            }
            if (parentId != null && !mongoose.Types.ObjectId.isValid(String(parentId))) {
                return res.status(400).json({ message: "Invalid parentId" });
            }

            const created = await commentService.createComment({
                authorId,
                postId,
                content,
                parentId,
            });
            return res.status(201).json(created);
        } catch (error) {
            if (
                error.message === "postId is required" ||
                error.message === "Comment content cannot be empty" ||
                error.message === "Comment and reply must belong to the same post"
            ) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === "Post not found" || error.message === "Parent comment not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "You can't comment on your own post") {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    // PATCH /comments/:commentId
    async editComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?._id ?? req.user?.id;;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const { content } = req.body;
            const updated = await commentService.editComment({ commentId, userId, content });
            return res.status(200).json(updated);
        } catch (error) {
            if (error.message === "Comment not found") {
                return res.status(404).json({ message: error.message });
            }
            if (
                error.message === "You can't edit this comment" ||
                error.message === "Comment content cannot be empty" ||
                error.message === "Removed comments cannot be edited"
            ) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    // DELETE /comments/:commentId
    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const user = req.user;
            if (!user) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const deleted = await commentService.deleteComment({ commentId, user });
            return res.status(200).json(deleted);
        } catch (error) {
            if (error.message === "Comment not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "You can't delete this comment") {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    // PATCH /comments/:commentId/like
    async toggleLike(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?._id ?? req.user?.id;;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const updated = await commentService.toggleLike({ commentId, userId });
            return res.status(200).json(updated);
        } catch (error) {
            if (error.message === "Comment not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Removed comments cannot be liked") {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },
    
    // PATCH /comments/:commentId/dislike
    async toggleDislike(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?._id ?? req.user?.id;;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const updated = await commentService.toggleDislike({ commentId, userId });
            return res.status(200).json(updated);
        } catch (error) {
            if (error.message === "Comment not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Removed comments cannot be disliked") {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },
};

export default CommentController;
