import authService from "../services/authService.js";
import { signAccessToken } from "../middleware/auth.js";

const AuthController = {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      return res.status(201).json(user);
    } catch (e) {
      const status =
        e.message === "registration_fields_required" ||
        e.message === "location_required" ||
        e.message === "username_taken" ||
        e.message === "email_taken"
          ? 400
          : 500;

      const detail =
        e.message === "registration_fields_required"
          ? "First name, last name, email, and password are required"
          : e.message === "location_required"
          ? "City and province or state are required"
          : e.message === "username_taken"
          ? "That display name is already taken"
          : e.message === "email_taken"
          ? "Email is taken"
          : "Server Error";

      return res.status(status).json({ detail });
    }
  },

  async login(req, res) {
    try {
      const user = await authService.login(req.body);
      const token = signAccessToken({
        id: user.id,
        role: user.role,
      });
      return res.json({ access_token: token, token_type: "bearer", user });
    } catch (e) {
      const status =
        e.message === "invalid_credentials" || e.message === "email_password_required"
          ? 401
          : e.message === "account_suspended"
          ? 403
          : 500;

      const detail =
        e.message === "email_password_required"
          ? "Email and password are required"
          : e.message === "invalid_credentials"
          ? "Wrong email or password"
          : e.message === "account_suspended"
          ? "Account is suspended"
          : "Server Error";

      return res.status(status).json({ detail });
    }
  },

  async me(req, res) {
    const user = await authService.getById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ detail: "User not found" });
    return res.json(user);
  },

  async updateMe(req, res) {
    try {
      const userId = req.user?._id ?? req.user?.id;
      if (!userId) return res.status(401).json({ detail: "Not authenticated" });
      const updated = await authService.updateProfile(userId, req.body ?? {});
      if (!updated) return res.status(404).json({ detail: "User not found" });
      return res.status(200).json(updated);
    } catch (e) {
      if (e.message === "bio_too_long") {
        return res.status(400).json({ detail: "Bio must be 600 characters or less" });
      }
      return res.status(500).json({ detail: "Server Error" });
    }
  },

  async uploadMyImage(req, res) {
    try {
      const userId = req.user?._id ?? req.user?.id;
      if (!userId) return res.status(401).json({ detail: "Not authenticated" });
      if (!req.file) return res.status(400).json({ detail: "Image file is required" });

      const imageUrl = req.file.path ?? req.file.secure_url ?? null;
      if (!imageUrl) return res.status(500).json({ detail: "Upload failed" });

      const updated = await authService.updateProfile(userId, { profileImage: imageUrl });
      if (!updated) return res.status(404).json({ detail: "User not found" });

      return res.status(200).json({
        profileImage: imageUrl,
        user: updated,
      });
    } catch {
      return res.status(500).json({ detail: "Server Error" });
    }
  },

  async getMyStats(req, res) {
    try {
      const userId = req.user?._id ?? req.user?.id;
      if (!userId) return res.status(401).json({ detail: "Not authenticated" });
      const stats = await authService.getProfileStats(userId);
      return res.status(200).json(stats);
    } catch {
      return res.status(500).json({ detail: "Server Error" });
    }
  },
};

export default AuthController;
