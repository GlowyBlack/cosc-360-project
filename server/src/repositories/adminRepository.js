import User from "../models/user.js";
import Book from "../models/book.js";
import Request from "../models/request.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";

const AdminRepository = {
  async findAllUsersLean() {
    return User.find()
      .select("-passwordHash -password_hash")
      .lean();
  },

  async findUsersByUsernameOrEmailRegex(regex) {
    return User.find({
      $or: [{ username: regex }, { email: regex }],
    })
      .select("_id username email role isSuspended isBanned")
      .lean();
  },

  async findBooksByTitleOrAuthorWithOwnerRegex(regex) {
    return Book.find({
      $or: [{ bookTitle: regex }, { bookAuthor: regex }],
    })
      .populate({
        path: "bookOwner",
        select: "_id username email role isSuspended isBanned",
      })
      .lean();
  },

  async aggregateBookCountsByOwnerIds(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    return Book.aggregate([
      { $match: { bookOwner: { $in: userIds } } },
      { $group: { _id: "$bookOwner", bookCount: { $sum: 1 } } },
    ]);
  },

  async updateUserByIdLean(id, patch) {
    return User.findByIdAndUpdate(id, patch, { returnDocument: "after" })
      .select("-passwordHash")
      .lean();
  },

  async findAllBooksForAdminLean() {
    return Book.find()
      .populate("bookOwner", "username email")
      .sort({ createdAt: -1 })
      .lean();
  },

  async deleteBookById(bookId) {
    return Book.findByIdAndDelete(bookId);
  },

  async existsActiveRequestForBook(bookId) {
    return Request.exists({
      status: { $in: ["Pending", "Accepted"] },
      $or: [{ bookId }, { offeredBookId: bookId }],
    });
  },

  async findPostsForAdminLean(filter) {
    return Post.find(filter)
      .populate("authorId", "username email role profileImage")
      .sort({ createdAt: -1 })
      .lean();
  },

  async updatePostRemovedLean(postId, isRemoved) {
    return Post.findByIdAndUpdate(
      postId,
      { isRemoved },
      { returnDocument: "after" }
    )
      .populate("authorId", "username email role profileImage")
      .lean();
  },

  async findCommentsForAdminLean(filter) {
    return Comment.find(filter)
      .populate("authorId", "username email role profileImage")
      .populate("postId", "title")
      .sort({ createdAt: -1 })
      .lean();
  },

  async updateCommentRemovedLean(commentId, isRemoved) {
    return Comment.findByIdAndUpdate(
      commentId,
      { isRemoved },
      { returnDocument: "after" }
    )
      .populate("authorId", "username email role profileImage")
      .populate("postId", "title")
      .lean();
  },
};

export default AdminRepository;
