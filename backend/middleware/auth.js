const jwt = require("jsonwebtoken");
const db = require("../db/config");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      "SELECT user_id, name, email, role, is_verified FROM users WHERE user_id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = result.rows[0];
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await db.query(
        "SELECT user_id, name, email, role FROM users WHERE user_id = $1",
        [decoded.userId]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};

module.exports = { auth, authorize, optionalAuth };
