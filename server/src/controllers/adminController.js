import User from "../models/user.js";
import Book from "../models/book.js";
import Request from "../models/request.js";
import Post from "../models/post.js";

/* 
TODO: 
  - Dataflow is Route -> Controller -> Service -> Repository
  - Move db queries to Admin Repository
*/

const AdminController = {
  async listUsers(req, res) {
    try {
      const users = await User.find()
        .select("-passwordHash -password_hash")
        .lean();
      return res.json(users);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async searchUsers(req, res) {
    try {
      const q = String(req.query.q ?? "").trim();
      if (!q) {
        return res.json([]);
      }

      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      const [directUsers, booksWithOwners] = await Promise.all([
        User.find({
          $or: [{ username: regex }, { email: regex }],
        })
          .select("_id username email role isSuspended isBanned")
          .lean(),
        Book.find({
          $or: [{ bookTitle: regex }, { bookAuthor: regex }],
        })
          .populate({
            path: "bookOwner",
            select: "_id username email role isSuspended isBanned",
          })
          .lean(),
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
      if (merged.length === 0) {
        return res.json([]);
      }

      const userIds = merged.map((u) => u._id);
      const counts = await Book.aggregate([
        { $match: { bookOwner: { $in: userIds } } },
        { $group: { _id: "$bookOwner", bookCount: { $sum: 1 } } },
      ]);
      const countMap = new Map(
        counts.map((c) => [String(c._id), c.bookCount])
      );

      const result = merged.map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        isSuspended: u.isSuspended,
        isBanned: u.isBanned,
        bookCount: countMap.get(String(u._id)) ?? 0,
      }));

      return res.json(result);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async suspendUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isSuspended: true },
        { returnDocument: "after" }
      )
        .select("-passwordHash")
        .lean();
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async unsuspendUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isSuspended: false },
        { returnDocument: "after" }
      )
        .select("-passwordHash")
        .lean();
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async banUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: true },
        { returnDocument: "after" }
      )
        .select("-passwordHash")
        .lean();
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async unbanUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: false },
        { returnDocument: "after" }
      )
        .select("-passwordHash")
        .lean();
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async getBooks(req, res) {
    try {
      const books = await Book.find()
        .populate("bookOwner", "username email")
        .sort({ createdAt: -1 })
        .lean();
      return res.json(books);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async deleteBook(req, res) {
    try {
      const bookId = req.params.id;
      const active = await Request.exists({
        status: { $in: ["Pending", "Accepted"] },
        $or: [{ bookId }, { offeredBookId: bookId }],
      });
      if (active) {
        return res.status(400).json({
          message:
            "Cannot delete book: it has active loans or pending requests",
        });
      }
      const deleted = await Book.findByIdAndDelete(bookId);
      if (!deleted) return res.status(404).json({ message: "Book not found" });
      return res.json({ message: "Book deleted", id: bookId });
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async listPosts(req, res) {
    try {
      const includeRemoved =
        String(req.query.includeRemoved ?? "").toLowerCase() === "true" ||
        String(req.query.includeRemoved ?? "") === "1";

      const query = includeRemoved ? {} : { isRemoved: false };

      const posts = await Post.find(query)
        .populate("authorId", "username email role profileImage")
        .sort({ createdAt: -1 })
        .lean();

      return res.json(posts);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async removePost(req, res) {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { isRemoved: true },
        { returnDocument: "after" }
      )
        .populate("authorId", "username email role profileImage")
        .lean();

      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.json(post);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },

  async restorePost(req, res) {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { isRemoved: false },
        { returnDocument: "after" }
      )
        .populate("authorId", "username email role profileImage")
        .lean();

      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.json(post);
    } catch {
      return res.status(500).json({ message: "Server Error" });
    }
  },
};

export default AdminController;
