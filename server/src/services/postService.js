import postRepository from "../repositories/postRepository.js";
import commentRepository from "../repositories/commentRepository.js";

function isOwner(postDoc, userId) {
    return String(postDoc.authorId?._id ?? postDoc.authorId) === String(userId);
}

const PostService = {
    async getAllPosts({ genre, bookTag }) {
        return await postRepository.findAll({ genre, bookTag });
    },

    async getPostById(postId) {
        const post = await postRepository.findById(postId);
        if (!post || post.isRemoved) return null;

        const comments = await commentRepository.findByPostId(postId);
        return { post, comments };
    },

    async getPostsByUserId(userId) {
        return await postRepository.findByUserId(userId);
    },

    async createPost({ authorId, title, content, genre, bookTag }) {
        const cleanTitle = String(title ?? "").trim();
        const cleanContent = String(content ?? "").trim();
        if (!cleanTitle) throw new Error("Title is required");
        if (!cleanContent) throw new Error("Content is required");

        const normalizedGenre = Array.isArray(genre)
            ? genre.map((g) => String(g).trim()).filter(Boolean)
            : [];

        const normalizedBookTag = {
            title:
                bookTag?.title != null && String(bookTag.title).trim() !== ""
                    ? String(bookTag.title).trim()
                    : null,
            author:
                bookTag?.author != null && String(bookTag.author).trim() !== ""
                    ? String(bookTag.author).trim()
                    : null,
        };

        return await postRepository.create({
            authorId,
            title: cleanTitle,
            content: cleanContent,
            genre: normalizedGenre,
            bookTag: normalizedBookTag,
        });
    },

    async updatePost(postId, userId, body) {
        const post = await postRepository.findById(postId);
        if (!post || post.isRemoved) throw new Error("Post not found");
        if (!isOwner(post, userId)) throw new Error("You can't edit this post");

        const updates = {};
        if (body.title != null) {
            const t = String(body.title).trim();
            if (!t) throw new Error("Title cannot be empty");
            updates.title = t;
        }
        if (body.content != null) {
            const c = String(body.content).trim();
            if (!c) throw new Error("Content cannot be empty");
            updates.content = c;
        }
        if (Array.isArray(body.genre)) {
            updates.genre = body.genre.map((g) => String(g).trim()).filter(Boolean);
        }
        if (body.bookTag !== undefined) {
            updates.bookTag = {
                title:
                    body.bookTag?.title != null && String(body.bookTag.title).trim() !== ""
                        ? String(body.bookTag.title).trim()
                        : null,
                author:
                    body.bookTag?.author != null && String(body.bookTag.author).trim() !== ""
                        ? String(body.bookTag.author).trim()
                        : null,
            };
        }

        if (Object.keys(updates).length < 1) return post;
        return await postRepository.updateById(postId, updates);
    },

    async deletePost(postId, user) {
        const post = await postRepository.findById(postId);
        if (!post || post.isRemoved) throw new Error("Post not found");

        const isAdmin = String(user?.role ?? "") === "Admin";
        if (!isOwner(post, user?._id ?? user?.id) && !isAdmin) {
            throw new Error("You can't delete this post");
        }

        return await postRepository.softDeleteById(postId);
    },

    async toggleLike(postId, userId) {
        const post = await postRepository.findById(postId);
        if (!post || post.isRemoved) throw new Error("Post not found");

        const hasLiked = (post.likes ?? []).some((id) => String(id) === String(userId));
        if (hasLiked) {
            return await postRepository.removeLike(postId, userId);
        }
        return await postRepository.addLike(postId, userId);
    },
};

export default PostService;
