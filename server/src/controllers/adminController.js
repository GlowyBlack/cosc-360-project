import User from "../models/user.js";
import Book from "../models/book.js";
import Request from "../models/request.js";

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

  async suspendUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isSuspended: true },
        { new: true }
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
        { new: true }
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
        { new: true }
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
      const books = await Book.find().lean();
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
};

export default AdminController;
