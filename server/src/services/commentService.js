import commentRepository from "../repositories/commentRepository.js";
import postRepository from "../repositories/postRepository.js";

function isOwner(commentDoc, userId) {
    return String(commentDoc.authorId?._id ?? commentDoc.authorId) === String(userId);
}

const CommentService = {
    async getComments({ postId, showRemoved = false, userRole = "Registered" }) {
        if (!postId) throw new Error("postId is required");

        const includeRemoved = Boolean(showRemoved) && String(userRole) === "Admin";
        return await commentRepository.findByPostId({ postId, includeRemoved });
    },

    async createComment({ authorId, postId, content, parentId = null }) {
        if (!authorId) throw new Error("Not authenticated");
        if (!postId) throw new Error("postId is required");

        const cleanContent = String(content ?? "").trim();
        if (!cleanContent) throw new Error("Comment content cannot be empty");

        const targetPost = await postRepository.findById(postId);
        if (!targetPost || targetPost.isRemoved) throw new Error("Post not found");
        const isPostAuthor = isOwner(targetPost, authorId);

        if (parentId != null) {
            const parent = await commentRepository.findById(parentId);
            if (!parent || parent.isRemoved) throw new Error("Parent comment not found");
            if (String(parent.postId) !== String(postId)) {
                throw new Error("Comment and reply must belong to the same post");
            }
        } else if (isPostAuthor) {
            
            throw new Error("You can't comment on your own post");
        }

        return await commentRepository.create({
            authorId,
            postId,
            content: cleanContent,
            parentId: parentId ?? null,
        });
    },

    async editComment({ commentId, userId, content }) {
        const comment = await commentRepository.findById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.isRemoved) throw new Error("Removed comments cannot be edited");
        if (!isOwner(comment, userId)) throw new Error("You can't edit this comment");

        const cleanContent = String(content ?? "").trim();
        if (!cleanContent) throw new Error("Comment content cannot be empty");

        return await commentRepository.updateContentById(commentId, cleanContent);
    },

    async deleteComment({ commentId, user }) {
        const comment = await commentRepository.findById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.isRemoved) return comment;

        const requesterId = user?._id ?? user?.id;
        const isAdmin = String(user?.role ?? "") === "Admin";
        if (!isOwner(comment, requesterId) && !isAdmin) {
            throw new Error("You can't delete this comment");
        }

        return await commentRepository.softDeleteById(commentId);
    },

    async toggleLike({ commentId, userId }) {
        const comment = await commentRepository.findById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.isRemoved) throw new Error("Removed comments cannot be liked");

        const hasLiked = (comment.likes ?? []).some((id) => String(id) === String(userId));
        if (hasLiked) {
            const updated = await commentRepository.removeLike(commentId, userId);
            return updated ?? (await commentRepository.findById(commentId));
        }
        const hadDisliked = (comment.dislikes ?? []).some((id) => String(id) === String(userId));
        if (hadDisliked) {
            await commentRepository.removeDislike(commentId, userId);
        }
        const updated = await commentRepository.addLike(commentId, userId);
        return updated ?? (await commentRepository.findById(commentId));
    },

    async toggleDislike({ commentId, userId }) {
        const comment = await commentRepository.findById(commentId);
        if (!comment) throw new Error("Comment not found");
        if (comment.isRemoved) throw new Error("Removed comments cannot be disliked");

        const hasDisliked = (comment.dislikes ?? []).some((id) => String(id) === String(userId));
        if (hasDisliked) {
            const updated = await commentRepository.removeDislike(commentId, userId);
            return updated ?? (await commentRepository.findById(commentId));
        }
        const hadLiked = (comment.likes ?? []).some((id) => String(id) === String(userId));
        if (hadLiked) {
            await commentRepository.removeLike(commentId, userId);
        }
        const updated = await commentRepository.addDislike(commentId, userId);
        return updated ?? (await commentRepository.findById(commentId));
    },
};

export default CommentService;
