import mongoose from "mongoose";
import postService from "../services/postService.js";
import { sendServiceError } from "../utils/httpError.js";

const PostController = {
    async getAllPosts(req, res) {
        try {
            const genre = req.query.genre ?? null;
            const bookTag = req.query.bookTag ?? null;
            const q = req.query.q ?? null;
            const posts = await postService.getAllPosts({ genre, bookTag, q });
            return res.status(200).json(posts);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getPostById(req, res) {
        try {
            const { postId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "Invalid post id" });
            }

            const result = await postService.getPostById(postId);
            if (!result) return res.status(404).json({ message: "Post not found" });
            return res.status(200).json(result);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getPostsByUserId(req, res) {
        try {
            const { userId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user id" });
            }
            const posts = await postService.getPostsByUserId(userId);
            return res.status(200).json(posts);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async createPost(req, res) {
        try {
            const authorId = req.user?._id ?? req.user?.id;
            if (!authorId) return res.status(401).json({ message: "Not authenticated" });

            const { title, content, genre, bookTag } = req.body;
            const post = await postService.createPost({
                authorId,
                title,
                content,
                genre,
                bookTag,
            });
            return res.status(201).json(post);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async updatePost(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "Invalid post id" });
            }

            const post = await postService.updatePost(postId, userId, req.body);
            return res.status(200).json(post);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async deletePost(req, res) {
        try {
            const { postId } = req.params;
            const user = req.user;
            if (!user) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "Invalid post id" });
            }

            await postService.deletePost(postId, user);
            return res.status(200).json({ success: true });
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async toggleLike(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "Invalid post id" });
            }

            const post = await postService.toggleLike(postId, userId);
            return res.status(200).json(post);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async toggleDislike(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({ message: "Invalid post id" });
            }

            const post = await postService.toggleDislike(postId, userId);
            return res.status(200).json(post);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },
};

export default PostController;
