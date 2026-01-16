import express from "express";
import { getGemeniResponse } from "../controller/gemenicontroller.js";

const router = express.Router();

// Test route to verify the route is working
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Gemini route is working!",
    path: "/api/gemeni/test"
  });
});

// POST /api/gemeni/getresponse
router.post("/getresponse", getGemeniResponse);

console.log("✅ Gemini routes loaded: /api/gemeni/getresponse, /api/gemeni/test");

export default router;
