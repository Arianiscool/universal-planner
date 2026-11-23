
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.use(session({
  store: new pgSession({
    pool,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.get("/", (req, res) => {
  res.json({ message: "Universal Planner API is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/auth", require("./auth"));
app.use("/api/planner", require("./planner"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
