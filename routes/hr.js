import express from "express";
import { registerHR, loginHR } from "../controller/hrController.js";

const router = express.Router();

router.post("/register", registerHR);
router.post("/login", loginHR);

export default router;
