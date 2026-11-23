
const express = require("express");
const pool = require("./db");
const { requireLogin } = require("./middleware");

const router = express.Router();

router.use(requireLogin);

// Get XP and XP history
router.get("/", async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT xp FROM users WHERE id = $1",
      [req.user.id]
    );

    const history = await pool.query(
      `SELECT amount, reason, created_at
       FROM xp_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      xp: user.rows[0].xp,
      history: history.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load XP." });
  }
});

// Create a custom reward
router.post("/custom", async (req, res) => {
  try {
    const { title, xpCost } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isInteger(xpCost) ||
      xpCost < 1 ||
      xpCost > 100000
    ) {
      return res.status(400).json({
        error: "Enter a valid reward and XP cost."
      });
    }

    const result = await pool.query(
      `INSERT INTO custom_rewards (user_id, title, xp_cost)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, title.trim(), xpCost]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create reward." });
  }
});

// View your custom rewards
router.get("/custom", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM custom_rewards
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load rewards." });
  }
});

// Redeem a reward
router.post("/redeem/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reward = await client.query(
      `SELECT * FROM custom_rewards
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!reward.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reward not found." });
    }

    const item = reward.rows[0];

    const user = await client.query(
      "SELECT xp FROM users WHERE id = $1 FOR UPDATE",
      [req.user.id]
    );

    if (user.rows[0].xp < item.xp_cost) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough XP." });
    }

    await client.query(
      "UPDATE users SET xp = xp - $1 WHERE id = $2",
      [item.xp_cost, req.user.id]
    );

    await client.query(
      `INSERT INTO reward_redemptions
       (user_id, reward_id, reward_title, xp_spent)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, item.id, item.title, item.xp_cost]
    );

    await client.query("COMMIT");

    res.json({ message: "Reward redeemed successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Could not redeem reward." });
  } finally {
    client.release();
  }
});

module.exports = router;
