import HR from "../model/hr.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const buildGeneratedEmail = (username) =>
  `${username.trim().toLowerCase()}@resumesync.email.com`;

export const registerHR = async (req, res) => {
  try {
    console.log('HR register called', { body: req.body });
    const { username, password } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const generatedemail = buildGeneratedEmail(normalizedUsername);

    const hrExists = await HR.findOne({
      $or: [{ username: normalizedUsername }, { generatedemail }],
    });

    if (hrExists) {
      return res.status(400).json({ message: "HR account already exists" });
    }

    const hr = new HR({
      username: normalizedUsername,
      password,
      generatedemail,
      role: "hr",
    });

    console.log('Saving HR', { username: normalizedUsername, generatedemail });
    await hr.save();
    console.log('HR saved', hr._id);

    const token = jwt.sign({ id: hr._id, role: hr.role }, JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: hr._id,
        username: hr.username,
        generatedemail: hr.generatedemail,
        role: hr.role,
      },
    });
  } catch (error) {
    console.error("HR register error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      code: error?.code,
      error,
    });
    const statusCode = error.code === 11000 ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message:
        error.code === 11000
          ? "HR account already exists"
          : error.message || "Internal Server Error",
    });
  }
};

export const loginHR = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const hr = await HR.findOne({ username: username.trim().toLowerCase() });

    if (!hr) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await hr.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: hr._id, role: hr.role }, JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.json({
      success: true,
      token,
      user: {
        id: hr._id,
        username: hr.username,
        generatedemail: hr.generatedemail,
        role: hr.role,
      },
    });
  } catch (error) {
    console.error("HR login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
