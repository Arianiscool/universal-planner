
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
      `INSERT INTO users
       (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, role`,
      [
        username.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        displayName || username
      ]
    );

    res.status(201).json({
      message: "Account created successfully!",
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Username or email already exists."
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

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, display_name,
       password_hash, role, status
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          error: "Could not create login session."
        });
      }

      req.session.userId = user.id;

      req.session.save((error) => {
        if (error) {
          return res.status(500).json({
            error: "Could not save login session."
          });
        }

        delete user.password_hash;
        res.json({ message: "Login successful!", user });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

// Check current login
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Not logged in."
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, display_name, role, status
       FROM users WHERE id = $1`,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return req.session.destroy(() => {
        res.status(401).json({ error: "Account unavailable." });
      });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not check login." });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: "Logout failed." });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully." });
  });
});

module.exports = router;
