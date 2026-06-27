import jwt from "jsonwebtoken";
import User from "../model/user.js";
import HR from "../model/hr.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const protectHR = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hr = await HR.findById(decoded.id).select("-password");

    if (!hr || hr.role !== "hr") {
      return res.status(401).json({ message: "Not authorized, invalid HR token" });
    }

    req.hr = hr;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
