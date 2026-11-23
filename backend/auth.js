
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required."
      });
    }

    if (password.length < 10) {
      return res.status(400).json({
        error: "Password must be at least 10 characters."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, role`,
      [username, email, passwordHash, displayName || username]
    );

    res.status(201).json({
      message: "Account created successfully!",
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Username or email is already registered."
      });
    }

    console.error(error);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, username, email, display_name, password_hash, role, status
       FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    delete user.password_hash;

    res.json({
      message: "Login successful!",
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

module.exports = router;
