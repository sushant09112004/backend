import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const getGemeniResponse = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required and must be a non-empty string",
      });
    }

    // Check if Google API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Google API key not configured. Please set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env",
      });
    }

    console.log("🤖 Calling Gemini API with prompt length:", prompt.trim().length);
    console.log("API Key present:", apiKey ? "Yes (first 10 chars: " + apiKey.substring(0, 10) + "...)" : "No");

    // Try different model names in order of preference
    const modelNames = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ];

    let responseText;
    let lastError;
    let triedModels = [];

    // Try each model name until one works
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        triedModels.push(modelName);
        
        const { text } = await generateText({
          model: google(modelName, { apiKey }),
          prompt: prompt.trim(),
        });

        responseText = text;
        console.log(`✅ Success with model: ${modelName}, response length: ${text?.length || 0}`);
        break; // Success, exit loop
      } catch (err) {
        lastError = err;
        console.log(`Model ${modelName} failed, trying next...`, err.message);
        continue; // Try next model
      }
    }

    if (!responseText) {
      throw lastError || new Error("All model attempts failed");
    }

    // Remove markdown code blocks if present
    const cleanedText = responseText.replace(/```html\n?/g, "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    res.status(200).json({
      success: true,
      response: cleanedText,
    });
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      errorDetails: error.errorDetails,
    });

    // Provide more helpful error message
    let errorMessage = "Failed to get Gemini response";
    if (error.message?.includes("404") || error.message?.includes("Not Found")) {
      errorMessage = `Model not found. Tried models: ${modelNames.join(", ")}. Please verify:
1. Your API key is valid and from Google AI Studio (https://makersuite.google.com/app/apikey)
2. The API key has access to Gemini models
3. Your API key is correctly set in .env file as GEMINI_API_KEY`;
    } else if (error.message?.includes("API key") || error.message?.includes("401") || error.message?.includes("403")) {
      errorMessage = "Invalid or unauthorized API key. Please check your GEMINI_API_KEY in the .env file and ensure it's valid.";
    } else if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      errorMessage = "API quota exceeded or rate limit reached. Please try again later.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      triedModels: triedModels.length > 0 ? triedModels : modelNames,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};