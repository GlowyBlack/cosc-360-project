import bcrypt from "bcryptjs";
import UserRepository from "../repositories/userRepository.js";
import bookRepository from "../repositories/bookRepository.js";
import requestRepository from "../repositories/requestRepository.js";

function isAllowedRegistrationEmail(email) {
  const value = String(email ?? "").trim().toLowerCase();
  if (!value) return false;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) return false;
  const domain = value.split("@")[1] ?? "";
  return domain === "example.com" || domain === "gmail.com" || domain === "outlook.com";
}

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    location: userDoc.location,
    role: userDoc.role,
    profileImage: userDoc.profileImage ?? null,
    bio: userDoc.bio ?? "",
    isSuspended: userDoc.isSuspended ?? false,
    totalScore: Number(userDoc.totalScore) || 0,
    reviewCounts: Number(userDoc.reviewCounts) || 0,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

const AuthService = {
  async register({ firstName, lastName, email, password, city, provinceState, profileImage }) {
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    const emailNorm = String(email || "").trim().toLowerCase();
    const passwordRaw = String(password || "");
    const cityTrim = String(city || "").trim();
    const provinceTrim = String(provinceState || "").trim();

    if (!first || !last || !emailNorm || !passwordRaw) {
      throw new Error("registration_fields_required");
    }
    if (!isAllowedRegistrationEmail(emailNorm)) {
      throw new Error("invalid_email_domain");
    }
    if (!cityTrim || !provinceTrim) {
      throw new Error("location_required");
    }
    const cleanProfileImage = String(profileImage || "").trim();
    if (!cleanProfileImage) {
      throw new Error("profile_image_required");
    }
    const location = `${cityTrim}, ${provinceTrim}`;

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
      location,
      profileImage: cleanProfileImage,
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
    if (user.isBanned) {
      throw new Error("account_suspended");
    }

    return sanitizeUser(user);
  },

  async getById(id) {
    const user = await UserRepository.findById(id);
    if (!user) return null;
    return sanitizeUser(user);
  },

  async updateProfile(id, { bio, profileImage }) {
    const current = await UserRepository.findById(id);
    if (!current) return null;

    const updates = {};
    if (bio !== undefined) {
      const cleanBio = String(bio ?? "").trim();
      if (cleanBio.length > 600) throw new Error("bio_too_long");
      updates.bio = cleanBio;
    }
    if (profileImage !== undefined) {
      const cleanImage = String(profileImage ?? "").trim();
      updates.profileImage = cleanImage || null;
    }

    if (Object.keys(updates).length < 1) {
      return sanitizeUser(current);
    }

    const updated = await UserRepository.updateProfileById(id, updates);
    return sanitizeUser(updated);
  },

  async getProfileStats(userId) {
    const booksListed = await bookRepository.countByOwner(userId);
    const exchangesCompleted = await requestRepository.countCompletedExchangesForUser(userId);
    const booksBorrowed = await requestRepository.countCompletedBorrowsAsBorrower(userId);
   
    return { booksListed, exchangesCompleted, booksBorrowed };
  },
};

export default AuthService;
