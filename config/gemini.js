import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  "AIzaSyCqyPyJjoFWva-SBDyLmRLOG4ar2Gv9PnQ";

export const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export function getGeminiModelNames() {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (!configured) return DEFAULT_GEMINI_MODELS;
  return [configured, ...DEFAULT_GEMINI_MODELS.filter((m) => m !== configured)];
}

export function createGeminiProvider() {
  return createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
}
