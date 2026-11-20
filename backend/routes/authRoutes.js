const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!cleanName || !cleanEmail || typeof password !== "string") {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "That email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "Registration successful. Please sign in." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That email is already registered." });
    }

    console.error("Registration failed:", error.message);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!cleanEmail || typeof password !== "string") {
    return res.status(400).json({ message: "Please enter your email and password." });
  }

  try {
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({ token });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email createdAt");
    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    const users = await User.find()
      .select("name email createdAt")
      .sort({ createdAt: -1 });

    return res.json({ user, users });
  } catch (error) {
    console.error("Dashboard request failed:", error.message);
    return res.status(500).json({ message: "Could not load dashboard information." });
  }
});

module.exports = router;
