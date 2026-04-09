import comment from "../models/comment.js";

const CommentRepository = {
    async syncReactionCounts(commentId) {
        const raw = await comment.findById(commentId).select("likes dislikes");
        if (!raw) return null;
        const likeCount = Array.isArray(raw.likes) ? raw.likes.length : 0;
        const dislikeCount = Array.isArray(raw.dislikes) ? raw.dislikes.length : 0;
        return await comment.findByIdAndUpdate(
            commentId,
            { $set: { likeCount, dislikeCount } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage role" });
    },

    async findByPostId({ postId, includeRemoved = false }) {
        const query = { postId };
        if (!includeRemoved) {
            query.isRemoved = false;
        }
        return await comment.find(query)
            .sort({ createdAt: 1 })
            .populate({ path: "authorId", select: "username profileImage" });
    },

    async findById(commentId) {
        return await comment.findById(commentId)
            .populate({ path: "authorId", select: "username profileImage role" });
    },

    async create(data) {
        const created = await comment.create(data);
        return await comment.findById(created._id)
            .populate({ path: "authorId", select: "username profileImage role" });
    },

    async updateContentById(commentId, content) {
        return await comment.findByIdAndUpdate(
            commentId,
            { $set: { content } },
            { returnDocument: "after", runValidators: true },
        ).populate({ path: "authorId", select: "username profileImage role" });
    },

    async softDeleteById(commentId) {
        return await comment.findByIdAndUpdate(
            commentId,
            { $set: { isRemoved: true } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage role" });
    },

    async addLike(commentId, userId) {
        await comment.findByIdAndUpdate(
            commentId,
            { $addToSet: { likes: userId } },
            { runValidators: false },
        );
        return await this.syncReactionCounts(commentId);
    },

    async removeLike(commentId, userId) {
        await comment.findByIdAndUpdate(
            commentId,
            { $pull: { likes: userId } },
            { runValidators: false },
        );
        return await this.syncReactionCounts(commentId);
    },

    async addDislike(commentId, userId) {
        await comment.findByIdAndUpdate(
            commentId,
            { $addToSet: { dislikes: userId } },
            { runValidators: false },
        );
        return await this.syncReactionCounts(commentId);
    },

    async removeDislike(commentId, userId) {
        await comment.findByIdAndUpdate(
            commentId,
            { $pull: { dislikes: userId } },
            { runValidators: false },
        );
        return await this.syncReactionCounts(commentId);
    },
};

export default CommentRepository;
