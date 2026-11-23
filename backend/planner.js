
const express = require("express");
const pool = require("./db");
const { requireLogin } = require("./middleware");

const router = express.Router();

router.use(requireLogin);

// Get all shared planner items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM planner_items ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load planner." });
  }
});

// Add a planner item
router.post("/", async (req, res) => {
  try {
    const { title, type, content } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof type !== "string" ||
      !["schedule", "task", "goal", "exam", "note"].includes(type)
    ) {
      return res.status(400).json({ error: "Invalid planner item." });
    }

    const result = await pool.query(
      `INSERT INTO planner_items
       (title, type, content, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        title.trim(),
        type,
        JSON.stringify(content || {}),
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create item." });
  }
});

// Edit a planner item
router.put("/:id", async (req, res) => {
  try {
    const { title, type, content } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof type !== "string" ||
      !["schedule", "task", "goal", "exam", "note"].includes(type)
    ) {
      return res.status(400).json({ error: "Invalid planner item." });
    }

    const result = await pool.query(
      `UPDATE planner_items
       SET title = $1, type = $2, content = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [
        title.trim(),
        type,
        JSON.stringify(content || {}),
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Item not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update item." });
  }
});

// Delete a planner item
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM planner_items WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Item not found." });
    }

    res.json({ message: "Planner item deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete item." });
  }
});

module.exports = router;
