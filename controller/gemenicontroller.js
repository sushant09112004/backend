import { generateText } from "ai";
import {
  GEMINI_API_KEY,
  createGeminiProvider,
  getGeminiModelNames,
} from "../config/gemini.js";

function formatGeminiError(error) {
  const details = error?.message || String(error);

  if (/quota|rate.?limit|429|exceeded your current quota/i.test(details)) {
    return {
      message:
        "Gemini API quota exceeded. Check billing at https://ai.dev/rate-limit or try again later.",
      code: "QUOTA_EXCEEDED",
      details,
    };
  }

  if (/not found|not supported/i.test(details)) {
    return {
      message:
        "No available Gemini model responded. Set GEMINI_MODEL in backend/.env to a supported model (e.g. gemini-2.5-flash).",
      code: "MODEL_NOT_FOUND",
      details,
    };
  }

  return {
    message: "Failed to generate Gemini response",
    code: "GEMINI_ERROR",
    details,
  };
}

export const getGemeniResponse = async (req, res) => {
  let triedModels = [];

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY not configured",
      });
    }

    const google = createGeminiProvider();
    const modelNames = getGeminiModelNames();

    let responseText;
    let lastError;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        triedModels.push(modelName);

        const { text } = await generateText({
          model: google(modelName),
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
    const formatted = formatGeminiError(error);
    console.error("❌ Gemini API error:", formatted.details);

    res.status(500).json({
      success: false,
      message: formatted.message,
      code: formatted.code,
      error: formatted.details,
      triedModels,
    });
  }
};
