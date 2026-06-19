import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GEMINI_API_KEY, getGeminiModelNames } from "../config/gemini.js";

// Load environment variables at the top of this file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI - this will be created lazily when needed
const getGenAI = () => {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return null;
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
};

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

    // Check if API key is configured and get Gemini AI instance
    const genAI = getGenAI();
    if (!genAI) {
      return res.status(500).json({
        error: "Gemini API key not configured",
        message: "Please set GEMINI_API_KEY in your .env file. Make sure the .env file is in the backend/ directory and the server has been restarted."
      });
    }

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    // Use Gemini to extract and structure resume sections
    // Use gemini-1.5-flash as it's the most commonly available and fast model
    // Fallback to gemini-pro if flash is not available
    const modelName = getGeminiModelNames()[0];
    console.log(`Using Gemini model: ${modelName}`);
    console.log(`API Key present: ${GEMINI_API_KEY ? "Yes (first 10 chars: " + GEMINI_API_KEY.substring(0, 10) + "...)" : "No"}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });

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

    let resumeData;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Extract JSON from response
      const text = response.text();
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      resumeData = JSON.parse(jsonText);
    } catch (apiError) {
      console.error("Error calling Gemini API:", apiError);
      
      // If API call fails, provide a more helpful error message
      if (apiError.message?.includes("API key") || apiError.status === 400) {
        throw new Error("Invalid or missing Gemini API key. Please check your .env file and ensure GEMINI_API_KEY is set correctly.");
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
      errorMessage = "Invalid Gemini API key. Please check your .env file and ensure GEMINI_API_KEY is set correctly. You can get a new key from https://makersuite.google.com/app/apikey";
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

