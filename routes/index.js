import express from "express";
import resumeRoutes from "./resume.js";
import authRoutes from "./auth.js";
import pdfRoutes from "./pdf.js";
import gemeniRoutes from "./gemeni.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

router.use("/resume", resumeRoutes);
router.use("/auth", authRoutes);
router.use("/pdf", pdfRoutes);
router.use("/gemeni", gemeniRoutes);

console.log("✅ All routes registered:");
console.log("   - /api/resume");
console.log("   - /api/auth");
console.log("   - /api/pdf");
console.log("   - /api/gemeni");

export default router;
