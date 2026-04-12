import mongoose from "mongoose";
import commentService from "../services/commentService.js";
import { sendServiceError } from "../utils/httpError.js";

function parseBoolean(value) {
    if (typeof value === "boolean") return value;
    return String(value ?? "").toLowerCase() === "true";
}

const CommentController = {
    async getMyComments(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });

            const limit = Number(req.query.limit);
            const skip = Number(req.query.skip);
            const { items, hasMore } = await commentService.getMyCommentHistory({
                userId,
                limit: Number.isFinite(limit) ? limit : 10,
                skip: Number.isFinite(skip) ? skip : 0,
            });
            return res.status(200).json({ comments: items, hasMore });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

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
            return sendServiceError(res, error);
        }
    },

    async createComment(req, res) {
        try {
            const authorId = req.user?._id ?? req.user?.id;
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
            return sendServiceError(res, error);
        }
    },

    async editComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const { content } = req.body;
            const updated = await commentService.editComment({ commentId, userId, content });
            return res.status(200).json(updated);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

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
            return sendServiceError(res, error);
        }
    },

    async toggleLike(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const updated = await commentService.toggleLike({ commentId, userId });
            return res.status(200).json(updated);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async toggleDislike(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(String(commentId))) {
                return res.status(400).json({ message: "Invalid comment id" });
            }

            const updated = await commentService.toggleDislike({ commentId, userId });
            return res.status(200).json(updated);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },
};

export default CommentController;
