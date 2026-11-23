
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Universal Planner API is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Connect authentication routes
app.use("/api/auth", require("./auth"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
