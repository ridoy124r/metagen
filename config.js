export const APP_NAME = "MetaGen";
export const MODEL = "gemini-2.5-flash";

// API key will be loaded at runtime from .env file
let API_KEY = "";

// Load API key from .env file at runtime
export async function initializeAPIKey() {
  try {
    // Try to fetch the .env file from the root
    const paths = ['.env', '/.env', '../.env'];
    
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const envContent = await response.text();
          console.log("Loaded .env file from:", path);
          const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*(.+?)(?:\n|$)/);
          if (match && match[1]) {
            const key = match[1].trim();
            if (key) {
              API_KEY = key;
              console.log("✓ API key loaded successfully");
              return;
            }
          }
        }
      } catch (err) {
        // Continue to next path
      }
    }
    
    // If .env file couldn't be loaded, try localStorage
    const storedKey = localStorage.getItem('VITE_GEMINI_API_KEY');
    if (storedKey) {
      API_KEY = storedKey;
      console.log("✓ API key loaded from localStorage");
      return;
    }
    
    console.warn("⚠ API key not found in .env file or localStorage");
  } catch (err) {
    console.warn("Error initializing API key:", err);
  }
}

export function getAPIKey() {
  return API_KEY;
}

export function setAPIKey(key) {
  API_KEY = key;
}

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
