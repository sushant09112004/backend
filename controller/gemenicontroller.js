const OPENAI_KEY =
  process.env.OPENAI_KEY ||
  process.env.OPENAI_API_KEY ||
  "";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
const FALLBACK_OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];

const cleanOpenAIResponse = (text) => {
  return String(text || "")
    .replace(/```json\s*/g, "")
    .replace(/```/g, "")
    .trim();
};

function formatOpenAIError(error) {
  const details = error?.message || String(error);

  if (/quota|rate.?limit|429|exceeded your current quota/i.test(details)) {
    return {
      message:
        "OpenAI API quota exceeded. Check your billing or try again later.",
      code: "QUOTA_EXCEEDED",
      details,
    };
  }

  return {
    message: "Failed to generate OpenAI response",
    code: "OPENAI_ERROR",
    details,
  };
}

export const getGemeniResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    if (!OPENAI_KEY) {
      return res.status(500).json({ success: false, message: "OPENAI_KEY not configured" });
    }

    const modelsToTry = Array.from(new Set([DEFAULT_OPENAI_MODEL, ...(process.env.OPENAI_FALLBACK?.split(',') || []), ...FALLBACK_OPENAI_MODELS]));
    let lastError;

    for (const model of modelsToTry) {
      try {
        const payload = {
          model,
          messages: [{ role: "user", content: prompt.trim() }],
          max_tokens: 1000,
          temperature: 0.2,
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
          lastError = data;
          // try next model on model not found or similar
          console.warn(`OpenAI model ${model} failed:`, data?.error || data);
          continue;
        }

        const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
        if (!text) {
          lastError = data || new Error("No text in response");
          continue;
        }

        return res.status(200).json({
          success: true,
          response: cleanOpenAIResponse(String(text).trim()),
          model,
        });
      } catch (err) {
        lastError = err;
        console.error(`OpenAI request failed for model ${model}:`, err);
      }
    }

    const formatted = formatOpenAIError(lastError || "No available OpenAI model responded");
    console.error("❌ OpenAI API error (all models tried):", formatted.details || lastError);
    return res.status(500).json({ success: false, message: formatted.message, code: formatted.code, error: lastError });
  } catch (error) {
    const formatted = formatOpenAIError(error);
    console.error("❌ OpenAI error:", formatted.details || error);
    return res.status(500).json({ success: false, message: formatted.message, code: formatted.code, error: formatted.details });
  }
};
