export const APP_NAME = "MetaGen";
export const MODEL = "gemini-2.5-flash";

// Read API key from environment variable or use default
// For Vercel: Set VITE_GEMINI_API_KEY in Environment Variables
// For local: Create .env file with VITE_GEMINI_API_KEY=your_key_here
const getApiKey = () => {
  // Try to get from window (for Vercel serverless function injection)
  if (typeof window !== 'undefined' && window.METAGEN_API_KEY) {
    return window.METAGEN_API_KEY;
  }
  // Fallback to default (will be overridden by Vercel env vars if using build tool)
  return "AIzaSyAFWyFL0XAstkAmi6ALVJd_S2AIQoWG8sk";
};

export const API_KEY = getApiKey();

export const MAX_FILES = 20;
export const MAX_KEYWORDS = {
	default: 50,
	Alamy: 30,
};

export const DEFAULT_PLATFORM = "Adobe Stock";
export const DEFAULT_CATEGORY = "Business / Finance";

export const GENERATION_CONFIG = {
  temperature: 0.2,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};
