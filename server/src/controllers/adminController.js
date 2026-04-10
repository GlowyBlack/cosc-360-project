import adminService from "../services/adminService.js";

function handleError(res, err) {
  if (err && typeof err.status === "number") {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Server Error" });
}

const AdminController = {
  async listUsers(req, res) {
    try {
      const users = await adminService.listUsers();
      return res.json(users);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async searchUsers(req, res) {
    try {
      const result = await adminService.searchUsers(req.query.q);
      return res.json(result);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async suspendUser(req, res) {
    try {
      const user = await adminService.suspendUser(req.params.id);
      return res.json(user);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async unsuspendUser(req, res) {
    try {
      const user = await adminService.unsuspendUser(req.params.id);
      return res.json(user);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async banUser(req, res) {
    try {
      const user = await adminService.banUser(req.params.id);
      return res.json(user);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async unbanUser(req, res) {
    try {
      const user = await adminService.unbanUser(req.params.id);
      return res.json(user);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async getBooks(req, res) {
    try {
      const books = await adminService.getBooks();
      return res.json(books);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async deleteBook(req, res) {
    try {
      const result = await adminService.deleteBook(req.params.id);
      return res.json(result);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async listPosts(req, res) {
    try {
      const posts = await adminService.listPosts(req.query);
      return res.json(posts);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async removePost(req, res) {
    try {
      const post = await adminService.removePost(req.params.id);
      return res.json(post);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async restorePost(req, res) {
    try {
      const post = await adminService.restorePost(req.params.id);
      return res.json(post);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async listComments(req, res) {
    try {
      const comments = await adminService.listComments(req.query);
      return res.json(comments);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async removeComment(req, res) {
    try {
      const comment = await adminService.removeComment(req.params.id);
      return res.json(comment);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async restoreComment(req, res) {
    try {
      const comment = await adminService.restoreComment(req.params.id);
      return res.json(comment);
    } catch (err) {
      return handleError(res, err);
    }
  },
};

export default AdminController;
