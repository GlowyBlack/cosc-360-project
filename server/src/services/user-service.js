import bcrypt from "bcryptjs";
import User from "../models/user.js";

const SALT_ROUNDS = 10;

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    role: userDoc.role,
    profile_image: userDoc.profile_image,
    bio: userDoc.bio,
    is_suspended: userDoc.is_suspended,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

const UserService = {
  async register({ username, email, password }) {
    const usernameNorm = String(username || "").trim();
    const emailNorm = String(email || "").trim().toLowerCase();
    const passwordRaw = String(password || "");

    if (!usernameNorm || !emailNorm || !passwordRaw) {
      throw new Error("username_email_password_required");
    }

    const existing = await User.findOne({
      $or: [{ username: usernameNorm }, { email: emailNorm }],
    }).lean();
    if (existing) {
      if (existing.username === usernameNorm) throw new Error("username_taken");
      if (existing.email === emailNorm) throw new Error("email_taken");
      throw new Error("user_exists");
    }

    const passwordHash = await bcrypt.hash(passwordRaw, SALT_ROUNDS);
    const created = await User.create({
      username: usernameNorm,
      email: emailNorm,
      password: passwordHash,
      role: "Registered",
    });

    return sanitizeUser(created);
  },

  async login({ username, password }) {
    const usernameNorm = String(username || "").trim();
    const passwordRaw = String(password || "");

    if (!usernameNorm || !passwordRaw) {
      throw new Error("username_password_required");
    }

    const user = await User.findOne({ username: usernameNorm });
    if (!user) throw new Error("invalid_credentials");

    const ok = await bcrypt.compare(passwordRaw, user.password);
    if (!ok) throw new Error("invalid_credentials");

    if (user.is_suspended) {
      throw new Error("account_suspended");
    }

    return sanitizeUser(user);
  },

  async getById(id) {
    const user = await User.findById(id);
    if (!user) return null;
    return sanitizeUser(user);
  },
};

export default UserService;

