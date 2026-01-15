import express from "express";
import { extractPDFText } from "../controller/pdfcontroller.js";
import { upload } from "../middlewares/uplaod.js";

const router = express.Router();

router.post("/extract-text", upload.single("file"), extractPDFText);

export default router;