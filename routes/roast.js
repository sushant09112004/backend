import express from "express";
import { roastResume } from "../controller/roastController.js";

const router = express.Router();

router.post("/", roastResume);

export default router;
