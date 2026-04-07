import Comment from "../models/comment.js";

const CommentRepository = {
    async findByPostId(postId) {
        return await Comment.find({ targetId: postId, isRemoved: false })
            .sort({ createdAt: 1 })
            .populate({ path: "authorId", select: "username profileImage" });
    },
};

export default CommentRepository;
