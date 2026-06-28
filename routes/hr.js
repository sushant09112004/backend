import express from "express";
import { registerHR, loginHR, getCurrentHR, changeHRPassword } from "../controller/hrController.js";
import {
  getShortlisted,
  getShortlistedIds,
  addToShortlist,
  updateShortlistNotes,
  removeFromShortlist,
} from "../controller/shortlistController.js";
import { protectHR } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", registerHR);
router.post("/login", loginHR);
router.get("/me", protectHR, getCurrentHR);
router.post("/change-password", protectHR, changeHRPassword);

router.get("/shortlist", protectHR, getShortlisted);
router.get("/shortlist/ids", protectHR, getShortlistedIds);
router.post("/shortlist", protectHR, addToShortlist);
router.patch("/shortlist/:id/notes", protectHR, updateShortlistNotes);
router.delete("/shortlist/:id", protectHR, removeFromShortlist);

export default router;
