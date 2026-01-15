import express from "express";
import resumeRoutes from "./resume.js";
import authRoutes from "./auth.js";
import pdfRoutes from "./pdf.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

router.use("/resume", resumeRoutes);
router.use("/auth", authRoutes);
router.use("/pdf", pdfRoutes);

export default router;
