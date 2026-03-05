import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createHistory,
  getUserHistory,
} from "../controller/historyController.js";

const router = express.Router();

router.use(protect);

router.post("/", createHistory);
router.get("/", getUserHistory);

export default router;

