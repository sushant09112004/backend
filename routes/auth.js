import express from "express";
import { register, login, googleLogin } from "../controller/authcontroller.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google
router.post("/google", googleLogin);

export default router;


