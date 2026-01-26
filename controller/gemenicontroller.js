import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const getGemeniResponse = async (req, res) => {
  let triedModels = []; // ✅ moved OUTSIDE

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY not configured",
      });
    }

    const modelNames = [
      "gemini-2.0-flash",
      "gemini-2.0-pro",
    ];

    let responseText;
    let lastError;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        triedModels.push(modelName);

        const { text } = await generateText({
          model: google(modelName, { apiKey }),
          prompt: prompt.trim(),
        });

        responseText = text;
        console.log(`✅ Success with ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        console.error(`❌ ${modelName} failed:`, err.message);
      }
    }

    if (!responseText) {
      throw lastError;
    }

    res.status(200).json({
      success: true,
      response: responseText.trim(),
    });

  } catch (error) {
    console.error("❌ Gemini API error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate Gemini response",
      error: error.message,
      triedModels,
    });
  }
};
