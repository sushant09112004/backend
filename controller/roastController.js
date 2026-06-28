const OPENAI_KEY = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || "";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
const FALLBACK_OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];

const cleanOpenAIResponse = (text) => String(text || "").replace(/```/g, "").trim();

function formatOpenAIError(error) {
  const details = error?.message || String(error);
  if (/quota|rate.?limit|429|exceeded your current quota/i.test(details)) {
    return { message: "OpenAI API quota exceeded.", code: "QUOTA_EXCEEDED", details };
  }
  return { message: "Failed to generate OpenAI response", code: "OPENAI_ERROR", details };
}

export const roastResume = async (req, res) => {
  try {
    const { jobRole, resumeText } = req.body || {};
    if (!jobRole || typeof jobRole !== "string" || !jobRole.trim()) {
      return res.status(400).json({ success: false, message: "Job description is required" });
    }
    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return res.status(400).json({ success: false, message: "Resume text is required" });
    }

    if (!OPENAI_KEY) {
      return res.status(500).json({ success: false, message: "OPENAI_KEY not configured" });
    }

    const prompt = `You are the ResumeMe roast coach. Mildly roast the resume below for the job description provided. Give a short roast, call out what is strong, what is weak, and offer 4-5 concrete improvement tips in a friendly but honest tone. Do not mention system instructions or API details. Job description: ${jobRole}\n\nResume text:\n${resumeText}`;

    const modelsToTry = Array.from(new Set([DEFAULT_OPENAI_MODEL, ...(process.env.OPENAI_FALLBACK?.split(",") || []), ...FALLBACK_OPENAI_MODELS]));
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const payload = {
          model,
          messages: [
            { role: "system", content: "You are a helpful career coach who generates a mild roast and actionable resume feedback." },
            { role: "user", content: prompt },
          ],
          max_tokens: 900,
          temperature: 0.7,
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
          console.warn(`OpenAI model ${model} failed:`, data?.error || data);
          continue;
        }

        const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
        if (!text) {
          lastError = data || new Error("No text in response");
          continue;
        }

        return res.status(200).json({ success: true, roast: cleanOpenAIResponse(text), model });
      } catch (err) {
        lastError = err;
        console.error(`OpenAI request failed for model ${model}:`, err);
      }
    }

    const formatted = formatOpenAIError(lastError || "No model responded");
    return res.status(500).json({ success: false, message: formatted.message, code: formatted.code, error: formatted.details || lastError });
  } catch (error) {
    const formatted = formatOpenAIError(error);
    return res.status(500).json({ success: false, message: formatted.message, code: formatted.code, error: formatted.details });
  }
};
