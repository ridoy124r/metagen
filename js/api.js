import { API_KEY, MODEL, GENERATION_CONFIG, MAX_KEYWORDS } from '../config.js';
import { getImage } from './state.js';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

export async function callAPI(img, { platform, category, extra }) {
  const target = getImage(img.id) || img;

  if (!target.base64) {
    await waitForBase64(target);
  }

  const kwLimit = MAX_KEYWORDS[platform] || MAX_KEYWORDS.default;

  const prompt = [
    "You are a senior stock media metadata specialist.",
    "Analyze the image carefully and return ONLY valid JSON with exactly these keys:",
    '{',
    '  "title": "string",',
    '  "description": "string",',
    '  "keywords": ["string"],',
    '  "mood": "string",',
    '  "suggested_use": "string"',
    '}',
    'Rules:',
    '- Title: max 70 characters, sentence case, concise, keyword-rich.',
    '- Description: 150-200 characters, natural language, no hashtags or quotes.',
    `- Keywords: exactly ${kwLimit} unique lowercase keywords or short phrases, most relevant first.`,
    '- Avoid duplicates, brand names, and vague terms unless essential.',
    '- Mood: one short phrase.',
    '- Suggested use: one short commercial or editorial use case.',
    `Context: platform=${platform}; category=${category}${extra ? `; extra=${extra}` : ''}`,
    'Make sure the output is just JSON and nothing else.'
  ].join("\n");

  console.log("Starting API call for image", img.id);
  console.log("API URL:", API_URL);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: target.mediaType, data: target.base64 } }
          ]
        }],
        generationConfig: GENERATION_CONFIG,
      })
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error("API response error:", res.status, errText);
      throw new Error("API error " + res.status + ": " + errText);
    }

    const data = await res.json();
    console.log("Raw API response:", data);
    const text = extractText(data);
    const result = parseJson(text, kwLimit);
    console.log("Final parsed result:", result);
    return result;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error("API request timed out after 60 seconds");
    }
    throw err;
  }
}

export async function retryOne(id, options) {
  const img = getImage(id);
  if (!img) return;
  img.state = "analyzing";
  img.meta = null;
  const { render } = await import('./render.js');
  render();
  const meta = await callAPI(img, options);
  img.meta = meta;
  img.state = "done";
  render();
}

function waitForBase64(img) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (img.base64) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - start > 10000) {
        clearInterval(timer);
        reject(new Error("Timed out preparing image data"));
      }
    }, 50);
  });
}

function extractText(data) {
  if (data.error) {
    console.error("API Error:", data.error);
    throw new Error(data.error.message || "API returned an error");
  }
  if (!data.candidates || !data.candidates[0]) {
    console.error("No candidates in response:", data);
    throw new Error("No candidates in API response");
  }
  const candidate = data.candidates[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.map(part => part.text || "").join("");
  if (!text) {
    console.error("Empty text in response:", candidate);
    throw new Error("Empty API response");
  }
  console.log("API Response text:", text);
  return text;
}

function parseJson(text, kwLimit) {
  try {
    const cleaned = text.replace(/```json|```/gi, "").trim();
    console.log("Cleaned text:", cleaned);
    
    const match = cleaned.match(/\{[\s\S]*\}/);
    const raw = match ? match[0] : cleaned;
    console.log("Raw JSON to parse:", raw);
    
    const parsed = JSON.parse(raw);
    console.log("Parsed JSON:", parsed);

    parsed.title = String(parsed.title || "Untitled").trim().slice(0, 70);
    parsed.description = String(parsed.description || "No description").trim();
    parsed.mood = String(parsed.mood || "Neutral").trim();
    parsed.suggested_use = String(parsed.suggested_use || "General use").trim();
    parsed.keywords = normalizeKeywords(parsed.keywords, kwLimit);
    
    return parsed;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Text was:", text);
    throw new Error("Failed to parse metadata JSON: " + e.message);
  }
}

function normalizeKeywords(keywords, kwLimit) {
  const list = Array.isArray(keywords)
    ? keywords
    : String(keywords || "").split(/[,\n;]/);

  const seen = new Set();
  const output = [];

  for (const item of list) {
    const clean = String(item || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    output.push(clean);
    if (output.length >= kwLimit) break;
  }

  return output;
}