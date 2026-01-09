import express from "express";
import resumeRoutes from "./resume.js";
import authRoutes from "./auth.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

router.use("/resume", resumeRoutes);
router.use("/auth", authRoutes);

export default router;
