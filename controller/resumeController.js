import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { GEMINI_API_KEY, getGeminiModelNames } from "../config/gemini.js";

// Load environment variables at the top of this file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_KEY = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

/**
 * Extract text from PDF and process with Gemini to create structured sections
 */
export const processResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const { jobDescription } = req.body;
    const pdfPath = req.file.path;

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    if (!OPENAI_KEY) {
      return res.status(500).json({
        error: "OpenAI API key not configured",
        message: "Please set OPENAI_KEY in your .env file. Make sure the .env file is in the backend/ directory and the server has been restarted."
      });
    }

    const prompt = `You are a resume parser. Extract and structure the following resume text into organized sections. 
    Return a JSON object with the following structure:
    {
      "personalInfo": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "website": ""
      },
      "summary": "",
      "experience": [
        {
          "title": "",
          "company": "",
          "location": "",
          "startDate": "",
          "endDate": "",
          "description": ""
        }
      ],
      "education": [
        {
          "degree": "",
          "institution": "",
          "location": "",
          "graduationDate": "",
          "gpa": ""
        }
      ],
      "skills": [],
      "projects": [
        {
          "name": "",
          "description": "",
          "technologies": []
        }
      ],
      "certifications": [],
      "languages": []
    }

    Resume text:
    ${extractedText}

    ${jobDescription ? `\nJob Description:\n${jobDescription}\n\nPlease also suggest improvements based on the job description.` : ""}

    Return ONLY valid JSON, no additional text.`;

    const extractJsonText = (text) => {
      if (typeof text !== "string") return "";

      const cleaned = text
        .replace(/```json\s*/g, "")
        .replace(/```/g, "")
        .replace(/[“”]/g, '"')
        .trim();

      const startIndex = cleaned.indexOf("{");
      if (startIndex === -1) {
        return cleaned;
      }

      let depth = 0;
      for (let i = startIndex; i < cleaned.length; i += 1) {
        const char = cleaned[i];
        if (char === "{") depth += 1;
        if (char === "}") depth -= 1;
        if (depth === 0) {
          return cleaned.slice(startIndex, i + 1).trim();
        }
      }

      return cleaned.slice(startIndex).trim();
    };

    const cleanJsonResponse = (text) => {
      let jsonText = extractJsonText(text);

      jsonText = jsonText
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*?)'/g, ': "$1"')
        .replace(/([\[{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/\r?\n/g, " ")
        .trim();

      return jsonText;
    };

    const parseJsonString = (jsonText) => {
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        const cleaned = cleanJsonResponse(jsonText);
        try {
          return JSON.parse(cleaned);
        } catch (secondError) {
          try {
            return new Function(`return (${cleaned})`)();
          } catch (fallbackError) {
            throw new Error(
              `Invalid JSON response from OpenAI. Parsing failed: ${parseError.message}`
            );
          }
        }
      }
    };

    let resumeData;
    
    try {
      const payload = {
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.1,
      };

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error("OpenAI API error:", data);
        if (data?.error?.message) {
          throw new Error(data.error.message);
        }
        throw new Error("OpenAI API returned an error");
      }

      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
      const jsonText = cleanJsonResponse(String(text || ""));

      resumeData = parseJsonString(jsonText);
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);

      // If API call fails, provide a more helpful error message
      if (apiError.message?.includes("API key") || apiError.status === 400) {
        throw new Error("Invalid or missing OpenAI API key. Please check your .env file and ensure OPENAI_KEY is set correctly.");
      }

      // Fallback: create basic structure from extracted text
      console.log("Using fallback: creating basic structure from extracted text");
      resumeData = {
        personalInfo: {
          name: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          website: ""
        },
        summary: extractedText.substring(0, 500),
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: []
      };
    }

    // Clean up uploaded file
    fs.unlinkSync(pdfPath);

    res.json({
      success: true,
      resumeData,
      originalText: extractedText
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      errorDetails: error.errorDetails
    });
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message?.includes("API key")) {
      errorMessage = "Invalid OpenAI API key. Please check your .env file and ensure OPENAI_KEY is set correctly.";
    }

    res.status(500).json({
      error: "Failed to process resume",
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

/**
 * Update resume data
 */
export const updateResume = async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: "Resume data is required" });
    }

    // Here you could save to database if needed
    // For now, just return the updated data
    res.json({
      success: true,
      resumeData
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    res.status(500).json({
      error: "Failed to update resume",
      message: error.message
    });
  }
};

