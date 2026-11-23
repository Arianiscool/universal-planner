
const pool = require("./db");

async function requireLogin(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: "Please log in first."
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, display_name, role, status
       FROM users WHERE id = $1`,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        error: "Your account is unavailable."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Authentication check failed."
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access required."
    });
  }

  next();
}

module.exports = { requireLogin, requireAdmin };
