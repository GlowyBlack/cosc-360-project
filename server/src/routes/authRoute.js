import express from "express";
import UserService from "../services/user-service.js";
import { requireAuth, signAccessToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const user = await UserService.register(req.body);
    return res.status(201).json(user);
  } catch (e) {
    const status =
      e.message === "username_email_password_required" ||
      e.message === "username_taken" ||
      e.message === "email_taken"
        ? 400
        : 500;

    const detail =
      e.message === "username_email_password_required"
        ? "Username, email, and password are required"
        : e.message === "username_taken"
        ? "Username is taken"
        : e.message === "email_taken"
        ? "Email is taken"
        : "Server Error";

    return res.status(status).json({ detail });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await UserService.login(req.body);
    const token = signAccessToken({
      _id: user.id,
      username: user.username,
      role: user.role,
    });
    return res.json({ access_token: token, token_type: "bearer", user });
  } catch (e) {
    const status =
      e.message === "invalid_credentials" || e.message === "username_password_required"
        ? 401
        : e.message === "account_suspended"
        ? 403
        : 500;

    const detail =
      e.message === "username_password_required"
        ? "Username and password are required"
        : e.message === "invalid_credentials"
        ? "Wrong username or password"
        : e.message === "account_suspended"
        ? "Account is suspended"
        : "Server Error";

    return res.status(status).json({ detail });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await UserService.getById(req.user._id);
  if (!user) return res.status(404).json({ detail: "User not found" });
  return res.json(user);
});

export default router;

