const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/config");
const validators = require("../middleware/validators");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Register new user
router.post("/register", validators.registerUser, async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, name, email, role, created_at`,
      [name, email, password_hash, role]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post("/login", validators.loginUser, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await db.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id]
    );

    // Generate token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, name, email, role, created_at, last_login, is_verified
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch("/me", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    values.push(req.user.user_id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")} 
       WHERE user_id = $${paramCount}
       RETURNING user_id, name, email, role`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Get current password hash
    const result = await db.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [req.user.user_id]
    );

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [
      newHash,
      req.user.user_id,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
