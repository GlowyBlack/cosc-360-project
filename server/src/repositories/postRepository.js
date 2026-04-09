import post from "../models/post.js";

const PostRepository = {
    async findAll({ genre, bookTag }) {
        const query = { isRemoved: false };

        if (genre) {
            query.genre = { $in: [genre] };
        }

        if (bookTag) {
            const safe = String(bookTag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.$or = [
                { "bookTag.title": { $regex: safe, $options: "i" } },
                { "bookTag.author": { $regex: safe, $options: "i" } },
            ];
        }

        return await post.find(query)
            .sort({ createdAt: -1 })
            .populate({ path: "authorId", select: "username profileImage" });
    },

    async findById(postId) {
        return await post.findById(postId)
            .populate({ path: "authorId", select: "username profileImage role" });
    },

    async findByUserId(userId) {
        return await post.find({ authorId: userId, isRemoved: false })
            .sort({ createdAt: -1 })
            .populate({ path: "authorId", select: "username profileImage" });
    },

    async create(data) {
        return await post.create(data);
    },

    async updateById(postId, updates) {
        return await post.findByIdAndUpdate(
            postId,
            { $set: updates },
            { returnDocument: "after", runValidators: true },
        )
            .populate({ path: "authorId", select: "username profileImage" });
    },

    async softDeleteById(postId) {
        return await post.findByIdAndUpdate(
            postId,
            { $set: { isRemoved: true } },
            { returnDocument: "after", runValidators: true },
        );
    },

    async addLike(postId, userId) {
        return await post.findOneAndUpdate(
            { _id: postId, likes: { $nin: [userId] } },
            { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage" });
    },

    async removeLike(postId, userId) {
        return await post.findOneAndUpdate(
            { _id: postId, likes: userId },
            { $pull: { likes: userId }, $inc: { likeCount: -1 } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage" });
    },

    async addDislike(postId, userId) {
        return await post.findOneAndUpdate(
            { _id: postId, dislikes: { $nin: [userId] } },
            { $addToSet: { dislikes: userId }, $inc: { dislikeCount: 1 } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage" });
    },

    async removeDislike(postId, userId) {
        return await post.findOneAndUpdate(
            { _id: postId, dislikes: userId },
            { $pull: { dislikes: userId }, $inc: { dislikeCount: -1 } },
            { returnDocument: "after", runValidators: false },
        ).populate({ path: "authorId", select: "username profileImage" });
    },
};

export default PostRepository;
