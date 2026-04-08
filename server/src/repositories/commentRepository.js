import comment from "../models/comment.js";

const CommentRepository = {
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
        return await comment.findByIdAndUpdate(
            commentId,
            { $addToSet: { likes: userId } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage role" });
    },

    async removeLike(commentId, userId) {
        return await comment.findByIdAndUpdate(
            commentId,
            { $pull: { likes: userId } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage role" });
    },
};

export default CommentRepository;
