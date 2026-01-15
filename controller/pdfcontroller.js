import { extractTextFromPDF } from "../services/pdf.service.js";

export const extractPDFText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const result = await extractTextFromPDF(req.file.buffer);

    if (!result.text || !result.text.trim()) {
      return res.status(422).json({
        success: false,
        message: "No text found in PDF (possibly scanned)",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to extract PDF text",
      error: error.message,
    });
  }
};
