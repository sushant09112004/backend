import express from "express";
import resumeRoutes from "./resume.js";
import authRoutes from "./auth.js";
import pdfRoutes from "./pdf.js";
import gemeniRoutes from "./gemeni.js";
import historyRoutes from "./history.js";
import hrRoutes from "./hr.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

router.use("/resume", resumeRoutes);
router.use("/auth", authRoutes);
router.use("/pdf", pdfRoutes);
router.use("/gemeni", gemeniRoutes);
router.use("/history", historyRoutes);
router.use("/hr", hrRoutes);

console.log("✅ All routes registered:");
console.log("   - /api/resume");
console.log("   - /api/auth");
console.log("   - /api/pdf");
console.log("   - /api/gemeni");
console.log("   - /api/history");
console.log("   - /api/hr");

export default router;
