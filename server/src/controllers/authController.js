import userService from "../services/authService.js";
import { signAccessToken } from "../middleware/auth.js";

const AuthController = {
  async register(req, res) {
    try {
      const user = await userService.register(req.body);
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
      const user = await userService.login(req.body);
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
    const user = await userService.getById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ detail: "User not found" });
    return res.json(user);
  },
};

export default AuthController;
