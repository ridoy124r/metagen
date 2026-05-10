import { getAPIKey, MODEL, GENERATION_CONFIG, MAX_KEYWORDS } from '../config.js';
import { getImage } from './state.js';

export async function callAPI(img, { platform, category, extra }) {
  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error("API key not loaded. Please add VITE_GEMINI_API_KEY to .env file.");
  }
  
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const target = getImage(img.id) || img;

  if (!target.base64) {
    await waitForBase64(target);
  }

  const kwLimit = MAX_KEYWORDS[platform] || MAX_KEYWORDS.default;

  const prompt = [
    "You are a senior stock media SEO specialist.",
    "Analyze the image carefully and generate HIGHLY DISCOVERABLE metadata optimized for stock platforms.",
    "Return ONLY valid JSON with exactly these keys:",
    '{',
    '  "title": "string",',
    '  "description": "string",',
    '  "keywords": ["string"],',
    '  "mood": "string",',
    '  "suggested_use": "string"',
    '}',
    '',
    '=== SEO OPTIMIZATION RULES ===',
    '',
    'TITLE (max 70 chars):',
    '  • Pattern: [Main Subject] [Action/Modifier] [Context]',
    '  • Include primary keyword early',
    '  • Descriptive not generic (e.g., "Young woman playing guitar" > "Woman")',
    '  • Sentence case, specific and keyword-rich',
    '  • Example: "Professional businessman analyzing financial data on laptop"',
    '',
    'DESCRIPTION (150-200 chars):',
    '  • Natural conversational language',
    '  • Naturally incorporate primary AND secondary keywords',
    '  • Include action verbs and context',
    '  • NO hashtags, quotes, or emojis',
    '  • Avoid duplicate text from title',
    '  • Example: "Closeup of hands typing on keyboard showing financial charts and data analysis on computer screen"',
    '',
    `KEYWORDS (exactly ${kwLimit}):`,
    '  • MIX of keyword types for maximum discoverability:',
    '    - 30% specific long-tail (2-4 words): "business team meeting", "laptop analysis"',
    '    - 40% primary + secondary keywords: "professional", "business", "finance", "data"',
    '    - 20% use-case/intent keywords: "social media", "blog featured", "marketing"',
    '    - 10% emotional/style descriptors: "modern", "professional", "contemporary"',
    '  • List by relevance - most specific first',
    '  • NO brand names, trademarks, duplicates, or vague terms',
    '  • Include compound keywords naturally',
    '',
    'MOOD (1 short phrase):',
    '  • Primary emotional/style descriptor',
    '  • Examples: "modern professional", "casual creative", "corporate formal"',
    '  • Directly impacts platform discoverability',
    '',
    'SUGGESTED_USE (1 specific use case):',
    '  • Commercial or editorial application',
    '  • Examples: "Blog featured image", "Social media marketing", "Business presentation"',
    '  • Increases click-through probability',
    '',
    `CONTEXT: platform=${platform}; category=${category}${extra ? `; extra=${extra}` : ''}`,
    'CRITICAL: Output must be ONLY valid JSON, nothing else.'
  ].join("\n");

  console.log("Starting API call for image", img.id);

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

    // SEO-optimize title: ensure it's specific and keyword-rich
    let title = String(parsed.title || "Untitled").trim();
    // Remove common weak prefixes
    title = title.replace(/^(the|a|an)\s+/i, "").trim();
    // Ensure sentence case
    title = title.charAt(0).toUpperCase() + title.slice(1);
    // Limit to 70 characters for SEO
    if (title.length > 70) {
      // Try to break at word boundary
      title = title.slice(0, 70).split(' ').slice(0, -1).join(' ');
    }
    parsed.title = title || "Untitled";

    // SEO-optimize description: ensure it's substantive and keyword-rich
    let description = String(parsed.description || "No description").trim();
    // Check minimum length (should be 150+ chars per SEO best practice)
    if (description.length < 80) {
      console.warn("Warning: Description may be too short for SEO", description);
    }
    parsed.description = description;

    // Ensure mood is present and meaningful
    let mood = String(parsed.mood || "Neutral").trim();
    mood = mood.charAt(0).toUpperCase() + mood.slice(1);
    parsed.mood = mood;

    // Ensure suggested_use is specific to platform/category
    let suggestedUse = String(parsed.suggested_use || "General use").trim();
    suggestedUse = suggestedUse.charAt(0).toUpperCase() + suggestedUse.slice(1);
    parsed.suggested_use = suggestedUse;

    // Normalize and prioritize keywords for SEO
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

  // Common weak terms to filter (not SEO-valuable)
  const weakTerms = new Set([
    'image', 'photo', 'picture', 'vector', 'graphic', 'illustration',
    'background', 'stock', 'media', 'file', 'digital', 'art', 'design',
    'concept', 'icon', 'symbol', 'abstract', 'element'
  ]);

  const seen = new Set();
  const output = [];
  const processed = [];

  for (const item of list) {
    const clean = String(item || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean || seen.has(clean)) continue;

    // Skip weak generic terms (unless the whole keyword is just that term)
    const words = clean.split(' ');
    const isWeakOnly = words.length === 1 && weakTerms.has(clean);
    
    if (isWeakOnly && output.length > 0) continue;

    seen.add(clean);
    // Store with word count to prioritize longer phrases (long-tail)
    processed.push({
      keyword: clean,
      wordCount: words.length,
      score: words.length // longer phrases = better specificity
    });
  }

  // Sort by: word count (long-tail first), then alphabetical for consistency
  processed.sort((a, b) => {
    if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
    return a.keyword.localeCompare(b.keyword);
  });

  // Extract sorted keywords up to limit
  for (const item of processed) {
    output.push(item.keyword);
    if (output.length >= kwLimit) break;
  }

  return output;
}