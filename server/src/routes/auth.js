const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY = "60m";

//Middleware

function getCurrentUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ detail: "Not authenticated" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ detail: "Admin privileges required" });
  }
  next();
}

function createAccessToken({ username, user_id, is_admin }) {
  return jwt.sign({ username, user_id, is_admin }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

//POST /auth/register

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const user = await userService.createUser({
      username,
      email,
      password_hash,
      is_admin: false,
    });

    return res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    });
  } catch (e) {
    const msg = e.message;
    const friendly =
      msg === "username_taken"
        ? "Username is taken"
        : msg === "email_taken"
        ? "Email is taken"
        : msg;
    return res.status(400).json({ detail: friendly });
  }
});

//POST /auth/token 
router.post("/token", async (req, res) => {
  const { username, password } = req.body;

  const user = await userService.getByUsername(username);
  const validPassword = user && (await bcrypt.compare(password, user.password_hash));

  if (!user || !validPassword) {
    return res.status(401).json({ detail: "Wrong username or password" });
  }

  if (user.is_suspended) {
    const rawUntil = user.suspended_until || "N/A";
    const reason = user.suspension_reason || "No suspension reason provided";

    let prettyUntil = rawUntil;
    try {
      const dt = new Date(rawUntil);
      prettyUntil = dt.toISOString().slice(0, 16).replace("T", " ");
    } catch {}

    return res.status(403).json({
      detail: `Your account is suspended until ${prettyUntil}. Suspension Reason: ${reason}`,
    });
  }

  const token = createAccessToken({
    username: user.username,
    user_id: user.id,
    is_admin: user.is_admin,
  });

  return res.json({ access_token: token, token_type: "bearer" });
});

//GET /auth/me 

router.get("/me", getCurrentUser, (req, res) => {
  const curr = req.user;
  return res.json({
    id: curr.user_id,
    username: curr.username,
    email: curr.email,
    is_admin: curr.is_admin,
  });
});

//GET /auth/users
router.get("/users", getCurrentUser, requireAdmin, async (req, res) => {
  const rows = await userService.getAllUsers();

  const users = rows.map((row) => ({
    id: parseInt(row.id),
    username: row.username,
    email: row.email,
    is_admin: ["true", "1", "yes"].includes(
      String(row.is_admin || "").trim().toLowerCase()
    ),
  }));

  return res.json(users);
});

//GET /auth/search

router.get("/search", getCurrentUser, requireAdmin, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ detail: "username query param required" });

  const usernameNorm = username.trim().toLowerCase();
  const rows = await userService.getAllUsers();

  const matched = rows
    .filter((row) => row.username.toLowerCase().includes(usernameNorm))
    .map((row) => ({
      id: parseInt(row.id),
      username: row.username,
      email: row.email,
      is_admin: ["true", "1", "yes"].includes(String(row.is_admin || "").toLowerCase()),
      is_suspended: ["true", "1", "yes"].includes(
        String(row.is_suspended || "").toLowerCase()
      ),
      suspended_until: row.suspended_until || null,
      suspension_reason: row.suspension_reason || null,
      warnings: parseInt(row.warnings || 0),
    }));

  return res.json(matched);
});

//POST /auth/suspend/:user_id

router.post("/suspend/:user_id", getCurrentUser, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  const durationMinutes = parseInt(req.query.duration_minutes);
  const reason = req.query.reason || null;

  if (!durationMinutes || durationMinutes < 1) {
    return res.status(400).json({ detail: "duration_minutes must be >= 1" });
  }

  try {
    const suspendedUser = await userService.suspendUser({
      admin_id: req.user.user_id,
      target_id: userId,
      duration_minutes: durationMinutes,
      reason,
    });

    return res.json({
      message: `User ${userId} suspended for ${durationMinutes} minutes.`,
      suspended_until: suspendedUser.suspended_until,
      suspension_reason: suspendedUser.suspension_reason || null,
    });
  } catch {
    return res.status(404).json({ detail: "User not found" });
  }
});

//POST /auth/unsuspend/:user_id 

router.post("/unsuspend/:user_id", getCurrentUser, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.user_id);

  try {
    await userService.unsuspendUser(req.user.user_id, userId);
    return res.json({ message: `User ${userId} is no longer suspended.` });
  } catch {
    return res.status(404).json({ detail: "User not found" });
  }
});

//PUT /auth/me

router.put("/me", getCurrentUser, async (req, res) => {
  const curr = req.user;
  const { username, email, is_admin } = req.body;

  const resolvedIsAdmin = curr.is_admin ? is_admin : undefined;

  try {
    const user = await userService.updateUser({
      user_id: curr.user_id,
      username,
      email,
      is_admin: resolvedIsAdmin,
    });

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    });
  } catch (e) {
    const msg = e.message;
    const code =
      msg === "User not found" ? 404 : 400;
    return res.status(code).json({ detail: msg });
  }
});

//GET /auth/suspended
router.get("/suspended", getCurrentUser, requireAdmin, async (req, res) => {
  const rows = await userService.getAllUsers();

  const suspended = rows
    .filter((row) =>
      ["true", "1", "yes"].includes(String(row.is_suspended || "").toLowerCase())
    )
    .map((row) => ({
      id: parseInt(row.id),
      username: row.username,
      email: row.email,
      is_suspended: true,
      suspended_until: row.suspended_until || "N/A",
      suspension_reason: row.suspension_reason || null,
      warnings: parseInt(row.warnings || 0),
    }));

  return res.json(suspended);
});

//GET /auth/search-users 

router.get("/search-users", getCurrentUser, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ detail: "username query param required" });

  const usernameNorm = username.trim().toLowerCase();

  const users = await userService.getAllUsers();
  const readingLists = await readingListService.getAllLists();

  // Group reading lists by user ID
  const listsByUser = {};
  for (const rl of readingLists) {
    const uid = rl.UserID;
    if (!listsByUser[uid]) listsByUser[uid] = [];
    listsByUser[uid].push(rl);
  }

  const results = users
    .filter((user) => user.username.toLowerCase().includes(usernameNorm))
    .map((user) => {
      const uid = String(user.id);
      const userLists = listsByUser[uid] || [];

      const structuredLists = userLists
        .filter((item) => String(item.IsPublic ?? "true").toLowerCase() === "true")
        .map((item) => ({
          name: item.Name || "My List",
          books: (item.ISBNs || "").split("|"),
        }));

      return {
        id: parseInt(user.id),
        username: user.username,
        reading_list: structuredLists,
      };
    });

  return res.json(results);
});

module.exports = router;