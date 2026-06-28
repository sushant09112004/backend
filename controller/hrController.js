import HR from "../model/hr.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const registerHR = async (req, res) => {
  try {
    console.log('HR register called', { body: req.body });
    const { name, company, email, password } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!company?.trim()) {
      return res.status(400).json({ message: "Company is required" });
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const hrExists = await HR.findOne({ email: normalizedEmail });

    if (hrExists) {
      return res.status(400).json({ message: "HR account already exists" });
    }

    const hr = new HR({
      name: name.trim(),
      company: company.trim(),
      email: normalizedEmail,
      password,
      role: "hr",
      status: "Active",
    });

    console.log('Saving HR', { name: hr.name, company: hr.company, email: hr.email });
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
        name: hr.name,
        company: hr.company,
        email: hr.email,
        role: hr.role,
        status: hr.status,
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
    const { username, email, password } = req.body;
    const identifier = (email || username || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const hr = await HR.findOne({ email: identifier });

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
        name: hr.name,
        company: hr.company,
        email: hr.email,
        role: hr.role,
        status: hr.status,
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

export const getCurrentHR = async (req, res) => {
  try {
    if (!req.hr) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const hr = await HR.findById(req.hr._id).select("-password");

    if (!hr) {
      return res.status(404).json({ message: "HR profile not found" });
    }

    return res.json({
      success: true,
      hr: {
        id: hr._id,
        name: hr.name,
        company: hr.company,
        email: hr.email,
        role: hr.role,
        status: hr.status,
      },
    });
  } catch (error) {
    console.error("Get current HR error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const changeHRPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.hr) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const hr = await HR.findById(req.hr._id);

    if (!hr) {
      return res.status(404).json({ message: "HR profile not found" });
    }

    const isMatch = await hr.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    hr.password = newPassword;
    await hr.save();

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change HR password error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};
