import bcrypt from "bcryptjs";
import UserRepository from "../repositories/userRepository.js";

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    role: userDoc.role,
    profileImage: userDoc.profileImage ?? null,
    bio: userDoc.bio ?? "",
    isSuspended: userDoc.isSuspended ?? false,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

const UserService = {
  async register({ firstName, lastName, email, password }) {
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    const emailNorm = String(email || "").trim().toLowerCase();
    const passwordRaw = String(password || "");

    if (!first || !last || !emailNorm || !passwordRaw) {
      throw new Error("registration_fields_required");
    }

    const usernameNorm = `${first} ${last}`;

    const existing = await UserRepository.findOneByUsernameOrEmail(
      usernameNorm,
      emailNorm
    );
    if (existing) {
      if (existing.username === usernameNorm) throw new Error("username_taken");
      if (existing.email === emailNorm) throw new Error("email_taken");
      throw new Error("user_exists");
    }

    const passwordHash = await bcrypt.hash(passwordRaw, 10);
    const created = await UserRepository.createUser({
      username: usernameNorm,
      email: emailNorm,
      passwordHash,
      role: "Registered",
    });

    return sanitizeUser(created);
  },

  async login({ email, password }) {
    const emailNorm = String(email || "").trim().toLowerCase();
    const passwordRaw = String(password || "");

    if (!emailNorm || !passwordRaw) {
      throw new Error("email_password_required");
    }

    const user = await UserRepository.findByEmail(emailNorm);
    if (!user) throw new Error("invalid_credentials");

    const isValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isValid) throw new Error("invalid_credentials");

    if (user.isSuspended) {
      throw new Error("account_suspended");
    }

    return sanitizeUser(user);
  },

  async getById(id) {
    const user = await UserRepository.findById(id);
    if (!user) return null;
    return sanitizeUser(user);
  },
};

export default UserService;
