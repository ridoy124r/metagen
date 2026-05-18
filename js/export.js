import { images } from './state.js';

export function exportCSV(platform) {
  const done = images.filter(i => i.state === "done" && i.meta);
  if (!done.length) return;

  let csv;
  
  if (platform === "Adobe Stock") {
    csv = generateAdobeStockCSV(done);
  } else if (platform === "Freepik") {
    csv = generateFreepikCSV(done);
  } else if (platform === "Magnific") {
    csv = generateMagnificCSV(done);
  } else {
    csv = generateGenericCSV(done, platform);
  }

  // Add BOM for Excel compatibility (can be removed manually if needed for direct Freepik upload)
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `metadata-${platform.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`;
  
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

function generateAdobeStockCSV(done) {
  // Adobe Stock format - optimized for their submission and search platform
  // Reference: Adobe Stock contributor guidelines for CSV bulk upload
  const headers = [
    "Filename",
    "Title",
    "Description",
    "Keywords",
    "Category",
    "Mood",
    "Orientation",
    "Image Model"
  ];
  
  const rows = done.map(({ file, meta: m }) => [
    file.name,
    m.title,
    m.description,
    // Adobe Stock prefers comma-separated keywords (max 10-15 per image)
    (m.keywords || []).join(", "),
    m.category || m.mood || "General", // Use AI-detected category, fallback to mood
    m.mood || "Neutral", // Mood/atmosphere
    detectOrientation(file.name), // Auto-detect orientation
    m.suggested_use || "Stock" // Model/subject classification
  ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
}
function detectOrientation(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes("landscape") || lower.includes("wide")) return "Landscape";
  if (lower.includes("portrait") || lower.includes("tall")) return "Portrait";
  if (lower.includes("square")) return "Square";
  // Could be enhanced to check actual image dimensions if file object has them
  return "Landscape"; // Default assumption
}

function generateFreepikCSV(done) {
  // Freepik format - strict validation for successful upload
  // Reference: Freepik contributor platform CSV requirements
  const headers = [
    "Filename",
    "Title",
    "Description",
    "Tags",
    "Category"
  ];
  
  const rows = done.map(({ file, meta: m }) => {
    // Clean and validate all fields
    const filename = String(file.name || "").trim();
    const title = cleanField(m.title || "Untitled", 70);
    const description = cleanField(m.description || "No description", 200);
    // Fallback to title keywords if no keywords provided
    const tags = (m.keywords && m.keywords.length > 0) 
      ? (m.keywords || []).join(", ")
      : extractTitleKeywords(title);
    // PRIORITY: Use AI-detected category from metadata, fallback to content analysis
    const category = m.category 
      ? String(m.category).trim()
      : detectCategoryFromContent(title, description, m.mood, m.suggested_use);
    
    return [
      filename,
      title,
      description,
      tags,
      category
    ].map(v => `"${String(v || "").replace(/"/g, '""')}"`);
  });

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
}

function generateMagnificCSV(done) {
  // Magnific format - uses semicolon as field separator
  // Reference: Magnific contributor CSV upload requirements
  // Format: filename;title;keywords;[prompt];[model]
  
  const rows = done.map(({ file, meta: m }) => {
    const filename = String(file.name || "").trim();
    const title = cleanField(m.title || "Untitled", 100);
    // Keywords separated by commas within the field
    const keywords = (m.keywords && m.keywords.length > 0)
      ? m.keywords.join(",")
      : extractTitleKeywords(title);
    // AI prompt (optional)
    const prompt = m.prompt ? cleanField(m.prompt, 200) : "";
    // Model used (optional) - e.g., "Midjourney 5", "DALL-E 3", "Stable Diffusion"
    const model = m.suggested_use || m.model || "";
    
    // Wrap each field in single quotes for Magnific format
    return [
      `'${filename.replace(/'/g, "''")}'`,
      `'${title.replace(/'/g, "''")}'`,
      `'${keywords.replace(/'/g, "''")}'`,
      `'${prompt.replace(/'/g, "''")}'`,
      `'${model.replace(/'/g, "''")}'`
    ].join(";");
  });

  // Magnific header: filename;title;keywords;prompt;model
  const header = "'filename';'title';'keywords';'prompt';'model'";
  return [header, ...rows].join("\n");
}

// Helper: Extract keywords from title if no keywords available
function extractTitleKeywords(title) {
  // Split title into meaningful words (remove common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  const words = title.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.has(w))
    .slice(0, 5); // Take first 5 meaningful words
  
  return words.length > 0 ? words.join(", ") : "general";
}

// Helper: Clean field values (remove newlines, extra spaces)
function cleanField(value, maxLength) {
  let cleaned = String(value || "")
    .replace(/\r\n/g, " ")  
    .replace(/\n/g, " ")    
    .replace(/\r/g, " ")    
    .replace(/\s+/g, " ")   
    .trim();
  
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength).trim();
  }
  
  return cleaned;
}

// Helper: Smart category detection based on title, description, mood, and keywords
function detectCategoryFromContent(title, description, mood, suggestedUse) {
  const content = (title + " " + description).toLowerCase();
  
  // Category keyword patterns with weights
  const categoryPatterns = {
    "Business": {
      keywords: ["business", "office", "professional", "corporate", "work", "conference", "meeting", 
                 "executive", "employee", "entrepreneur", "finance", "financial", "presentation",
                 "laptop", "workspace", "desk", "manager", "team", "company", "corporate", "report",
                 "analysis", "strategy", "marketing", "sales", "entrepreneur", "startup"],
      weight: 0,
      boost: 0
    },
    "Design": {
      keywords: ["design", "graphic", "creative", "modern", "aesthetic", "pattern", "layout",
                 "color", "art", "illustration", "style", "contemporary", "digital", "vector",
                 "designer", "mockup", "brand", "web", "ui", "interface", "creative", "design system"],
      weight: 0,
      boost: 0
    },
    "Nature": {
      keywords: ["nature", "landscape", "outdoor", "mountain", "tree", "forest", "sky", "water",
                 "beach", "ocean", "sunset", "sunrise", "plant", "flower", "garden", "wildlife",
                 "animal", "natural", "scenic", "environment", "green", "field", "river", "lake"],
      weight: 0,
      boost: 0
    },
    "People": {
      keywords: ["woman", "man", "person", "people", "human", "portrait", "face", "girl", "boy",
                 "family", "child", "adult", "people", "group", "team", "friends", "couple",
                 "person", "individual", "character", "smile", "expression", "emotion"],
      weight: 0,
      boost: 0
    },
    "Technology": {
      keywords: ["technology", "digital", "computer", "tech", "electronic", "gadget", "phone",
                 "smartphone", "tablet", "software", "network", "cyber", "internet", "robot",
                 "ai", "machine", "innovation", "tech", "device", "data", "server", "circuit"],
      weight: 0,
      boost: 0
    },
    "Health": {
      keywords: ["health", "fitness", "wellness", "yoga", "exercise", "sport", "medical", "doctor",
                 "hospital", "healthcare", "diet", "nutrition", "gym", "trainer", "mental",
                 "meditation", "wellbeing", "therapy", "healthy", "athlete", "training", "yoga"],
      weight: 0,
      boost: 0
    },
    "Food": {
      keywords: ["food", "cooking", "recipe", "kitchen", "cook", "meal", "dish", "restaurant",
                 "ingredient", "beverage", "coffee", "drink", "cuisine", "culinary", "eat",
                 "chef", "bake", "dessert", "fruit", "vegetable", "bread", "cheese"],
      weight: 0,
      boost: 0
    },
    "Travel": {
      keywords: ["travel", "trip", "tourist", "destination", "tourism", "journey", "explore",
                 "adventure", "passport", "luggage", "hotel", "vacation", "holiday", "tour",
                 "backpacker", "world", "map", "sightseeing"],
      weight: 0,
      boost: 0
    },
    "Education": {
      keywords: ["education", "learning", "study", "school", "student", "teacher", "class",
                 "university", "college", "course", "training", "lesson", "knowledge", "academic",
                 "book", "reading", "library", "tutorial", "learn"],
      weight: 0,
      boost: 0
    },
    "Abstract": {
      keywords: ["abstract", "texture", "pattern", "geometric", "shape", "color", "background",
                 "minimal", "simple", "artistic", "creative", "gradient", "blend", "effect"],
      weight: 0,
      boost: 0
    }
  };

  // Score each category based on keyword matches
  for (const [category, data] of Object.entries(categoryPatterns)) {
    let score = 0;
    
    // Count keyword matches in content
    for (const keyword of data.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = (content.match(regex) || []).length;
      score += matches;
    }
    
    categoryPatterns[category].weight = score;
  }

  // Apply mood/suggested_use as boosts
  const moodBoost = mapToFreepikCategory(mood || suggestedUse || "");
  if (moodBoost && categoryPatterns[moodBoost]) {
    categoryPatterns[moodBoost].boost += 3; // Boost mood-based category
  }

  // Find category with highest score
  let bestCategory = "Design"; // Default fallback
  let bestScore = 0;
  
  for (const [category, data] of Object.entries(categoryPatterns)) {
    const totalScore = data.weight + data.boost;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCategory = category;
    }
  }

  // If no match found, fall back to mood-based detection
  if (bestScore === 0) {
    return mapToFreepikCategory(mood || suggestedUse || "General");
  }

  return bestCategory;
}

// Helper: Map mood/suggested_use to valid Freepik categories (fallback/boost)
function mapToFreepikCategory(value) {
  const categoryMap = {
    "professional": "Business", "business": "Business", "corporate": "Business",
    "modern": "Design", "creative": "Design", "contemporary": "Design",
    "nature": "Nature", "outdoor": "Nature", "landscape": "Nature",
    "technology": "Technology", "tech": "Technology", "digital": "Technology",
    "health": "Health", "fitness": "Health", "wellness": "Health", "yoga": "Health",
    "people": "People", "person": "People", "woman": "People", "man": "People", "portrait": "People",
    "travel": "Travel", "food": "Food", "cooking": "Food",
    "abstract": "Abstract", "texture": "Abstract",
    "education": "Education", "learning": "Education",
    "business use": "Business", "blog featured": "Design", "social media": "Design",
    "marketing": "Business", "presentation": "Business"
  };
  
  const lower = String(value || "").toLowerCase().trim();
  if (categoryMap[lower]) return categoryMap[lower];
  
  // Partial match
  for (const [key, category] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return category;
  }
  
  return null; // No match
}

function generateGenericCSV(done, platform) {
  // Generic format for other platforms
  const headers = ["Filename", "Title", "Description", "Keywords", "Category", "Mood", "Suggested Use", "Platform"];
  
  const rows = done.map(({ file, meta: m }) => [
    file.name,
    m.title,
    m.description,
    (m.keywords || []).join("; "),
    m.category || "General",
    m.mood || "",
    m.suggested_use || "",
    platform
  ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
}