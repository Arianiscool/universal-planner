
const express = require("express");
const pool = require("./db");
const { requireLogin, requireAdmin } = require("./middleware");

const router = express.Router();

router.use(requireLogin, requireAdmin);

// Record admin actions
async function logAction(userId, action) {
  await pool.query(
    "INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)",
    [userId, action]
  );
}

// View all users
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, display_name,
       role, status, created_at
       FROM users ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load users." });
  }
});

// Suspend or reactivate an account
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const result = await pool.query(
      `UPDATE users SET status = $1
       WHERE id = $2
       RETURNING id, username, status`,
      [status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found." });
    }

    await logAction(
      req.user.id,
      `Changed user ${req.params.id} status to ${status}`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update account." });
  }
});

// Assign or remove admin permissions
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["member", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({
        error: "You cannot change your own role."
      });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1
       WHERE id = $2
       RETURNING id, username, role`,
      [role, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found." });
    }

    await logAction(
      req.user.id,
      `Changed user ${req.params.id} role to ${role}`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update role." });
  }
});

// Delete an account
router.delete("/users/:id", async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({
        error: "You cannot delete your own account here."
      });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, username",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found." });
    }

    await logAction(
      req.user.id,
      `Deleted user ${req.params.id}`
    );

    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete account." });
  }
});

// View activity logs
router.get("/logs", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT activity_logs.*, users.username
       FROM activity_logs
       LEFT JOIN users ON users.id = activity_logs.user_id
       ORDER BY activity_logs.created_at DESC
       LIMIT 200`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load activity logs." });
  }
});

module.exports = router;
