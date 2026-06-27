import express from "express";
import { registerHR, loginHR, getCurrentHR, changeHRPassword } from "../controller/hrController.js";
import { protectHR } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", registerHR);
router.post("/login", loginHR);
router.get("/me", protectHR, getCurrentHR);
router.post("/change-password", protectHR, changeHRPassword);

export default router;
