import adminRepository from "../repositories/adminRepository.js";
import { httpError } from "../utils/httpError.js";

function parseIncludeRemoved(query) {
  return (
    String(query?.includeRemoved ?? "").toLowerCase() === "true" ||
    String(query?.includeRemoved ?? "") === "1"
  );
}

const AdminService = {
  async listUsers() {
    return adminRepository.findAllUsersLean();
  },

  async searchUsers(q) {
    const trimmed = String(q ?? "").trim();
    if (!trimmed) return [];

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const [directUsers, booksWithOwners] = await Promise.all([
      adminRepository.findUsersByUsernameOrEmailRegex(regex),
      adminRepository.findBooksByTitleOrAuthorWithOwnerRegex(regex),
    ]);

    const byId = new Map();

    for (const u of directUsers) {
      byId.set(String(u._id), u);
    }

    for (const b of booksWithOwners) {
      const owner = b.bookOwner;
      if (owner && owner._id) {
        const id = String(owner._id);
        if (!byId.has(id)) {
          byId.set(id, {
            _id: owner._id,
            username: owner.username,
            email: owner.email,
            role: owner.role,
            isSuspended: owner.isSuspended,
            isBanned: owner.isBanned,
          });
        }
      }
    }

    const merged = [...byId.values()];
    if (merged.length === 0) return [];

    const userIds = merged.map((u) => u._id);
    const counts = await adminRepository.aggregateBookCountsByOwnerIds(userIds);
    const countMap = new Map(counts.map((c) => [String(c._id), c.bookCount]));

    return merged.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      isSuspended: u.isSuspended,
      isBanned: u.isBanned,
      bookCount: countMap.get(String(u._id)) ?? 0,
    }));
  },

  async suspendUser(userId) {
    const user = await adminRepository.updateUserByIdLean(userId, {
      isSuspended: true,
    });
    if (!user) throw httpError(404, "User not found");
    return user;
  },

  async unsuspendUser(userId) {
    const user = await adminRepository.updateUserByIdLean(userId, {
      isSuspended: false,
    });
    if (!user) throw httpError(404, "User not found");
    return user;
  },

  async banUser(userId) {
    const user = await adminRepository.updateUserByIdLean(userId, {
      isBanned: true,
    });
    if (!user) throw httpError(404, "User not found");
    return user;
  },

  async unbanUser(userId) {
    const user = await adminRepository.updateUserByIdLean(userId, {
      isBanned: false,
    });
    if (!user) throw httpError(404, "User not found");
    return user;
  },

  async getBooks() {
    return adminRepository.findAllBooksForAdminLean();
  },

  async deleteBook(bookId) {
    const active = await adminRepository.existsActiveRequestForBook(bookId);
    if (active) {
      throw httpError(
        400,
        "Cannot delete book: it has active loans or pending requests"
      );
    }

    const deleted = await adminRepository.deleteBookById(bookId);
    if (!deleted) throw httpError(404, "Book not found");
    return { message: "Book deleted", id: bookId };
  },

  async listPosts(query) {
    const includeRemoved = parseIncludeRemoved(query);
    const filter = includeRemoved ? {} : { isRemoved: false };
    return adminRepository.findPostsForAdminLean(filter);
  },

  async removePost(postId) {
    const post = await adminRepository.updatePostRemovedLean(postId, true);
    if (!post) throw httpError(404, "Post not found");
    return post;
  },

  async restorePost(postId) {
    const post = await adminRepository.updatePostRemovedLean(postId, false);
    if (!post) throw httpError(404, "Post not found");
    return post;
  },

  async listComments(query) {
    const includeRemoved = parseIncludeRemoved(query);
    const filter = includeRemoved ? {} : { isRemoved: false };
    return adminRepository.findCommentsForAdminLean(filter);
  },

  async removeComment(commentId) {
    const comment = await adminRepository.updateCommentRemovedLean(
      commentId,
      true
    );
    if (!comment) throw httpError(404, "Comment not found");
    return comment;
  },

  async restoreComment(commentId) {
    const comment = await adminRepository.updateCommentRemovedLean(
      commentId,
      false
    );
    if (!comment) throw httpError(404, "Comment not found");
    return comment;
  },
};

export default AdminService;
