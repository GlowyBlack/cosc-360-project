import authService from "../services/authService.js";
import { signAccessToken } from "../middleware/auth.js";
import { serviceErrorStatus } from "../utils/httpError.js";

const AuthController = {
  async register(req, res) {
    try {
      const payload = { ...req.body };
      if (req.file?.path || req.file?.secure_url) {
        payload.profileImage = req.file.path ?? req.file.secure_url;
      }
      const user = await authService.register(payload);
      return res.status(201).json(user);
    } catch (e) {
      const status = serviceErrorStatus(e);
      const detailMap = {
        registration_fields_required: "First name, last name, email, and password are required",
        invalid_email_domain: "Use a valid email from example.com, gmail.com, or outlook.com",
        location_required: "City and province or state are required",
        profile_image_required: "Profile picture is required",
        username_taken: "That display name is already taken",
        email_taken: "Email is taken",
        user_exists: "An account with this information already exists",
      };
      const detail = detailMap[e.message] ?? (status < 500 ? e.message : "Server Error");
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
      const status = serviceErrorStatus(e);
      const detailMap = {
        email_password_required: "Email and password are required",
        invalid_credentials: "Wrong email or password",
        account_suspended: "Account is suspended",
      };
      const detail = detailMap[e.message] ?? (status < 500 ? e.message : "Server Error");
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
      const status = serviceErrorStatus(e);
      const detail =
        e.message === "bio_too_long"
          ? "Bio must be 600 characters or less"
          : status < 500
            ? e.message
            : "Server Error";
      return res.status(status).json({ detail });
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
