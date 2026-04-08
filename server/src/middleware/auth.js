import jwt from "jsonwebtoken";
import User from "../models/user.js";

/* 
TODO: 
    - Renew user token for every call
*/

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id ?? payload._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(userId).select("-passwordHash").lean();
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: "Your account is suspended" });
    }

    req.user = { ...user, id: user._id };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id ?? payload._id;
    if (!userId) return next();

    const user = await User.findById(userId).select("-passwordHash").lean();
    if (!user || user.isBanned || user.isSuspended) return next();

    req.user = { ...user, id: user._id };
  } catch {
    // Ignore optional auth errors and continue as anonymous.
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

export function signAccessToken(payload, { expiresIn = "60m" } = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
