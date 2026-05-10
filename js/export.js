import { images } from './state.js';

export function exportCSV(platform) {
  const done = images.filter(i => i.state === "done" && i.meta);
  if (!done.length) return;

  let csv;
  
  if (platform === "Adobe Stock") {
    csv = generateAdobeStockCSV(done);
  } else if (platform === "Freepik") {
    csv = generateFreepikCSV(done);
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
    // Adobe Stock prefers space-separated keywords (max 10-15 per image)
    (m.keywords || []).join(" "),
    m.mood || "General", // Primary category
    m.mood || "Neutral", // Mood/atmosphere
    detectOrientation(file.name), // Auto-detect orientation
    m.suggested_use || "Stock" // Model/subject classification
  ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
}

// Helper: Detect image orientation from filename or default
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
    const category = mapToFreepikCategory(m.mood || m.suggested_use || "General");
    
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

// Helper: Map mood/suggested_use to valid Freepik categories
function mapToFreepikCategory(value) {
  const categoryMap = {
    // Map common moods/uses to Freepik valid categories
    "professional": "Business",
    "business": "Business",
    "corporate": "Business",
    "modern": "Design",
    "creative": "Design",
    "contemporary": "Design",
    "nature": "Nature",
    "outdoor": "Nature",
    "landscape": "Nature",
    "technology": "Technology",
    "tech": "Technology",
    "digital": "Technology",
    "health": "Health",
    "fitness": "Health",
    "wellness": "Health",
    "yoga": "Health",
    "people": "People",
    "person": "People",
    "woman": "People",
    "man": "People",
    "portrait": "People",
    "travel": "Travel",
    "food": "Food",
    "cooking": "Food",
    "abstract": "Abstract",
    "texture": "Abstract",
    "education": "Education",
    "learning": "Education",
    "business use": "Business",
    "blog featured": "Design",
    "social media": "Design",
    "marketing": "Business",
    "presentation": "Business"
  };
  
  const lower = String(value || "").toLowerCase().trim();
  
  // Try exact match first
  if (categoryMap[lower]) {
    return categoryMap[lower];
  }
  
  // Try partial match (longest match wins for accuracy)
  let bestMatch = null;
  let bestLength = 0;
  for (const [key, category] of Object.entries(categoryMap)) {
    if (lower.includes(key) && key.length > bestLength) {
      bestMatch = category;
      bestLength = key.length;
    }
  }
  if (bestMatch) {
    return bestMatch;
  }
  
  // Deterministic fallback based on first character
  const validCategories = [
    "Design", "Business", "Nature", "Technology", 
    "People", "Health", "Education", "Abstract"
  ];
  
  // Use character code of first letter for deterministic selection
  const charCode = lower.charCodeAt(0) || 0;
  const index = charCode % validCategories.length;
  return validCategories[index];
}

function generateGenericCSV(done, platform) {
  // Generic format for other platforms
  const headers = ["Filename", "Title", "Description", "Keywords", "Mood", "Suggested Use", "Platform"];
  
  const rows = done.map(({ file, meta: m }) => [
    file.name,
    m.title,
    m.description,
    (m.keywords || []).join("; "),
    m.mood || "",
    m.suggested_use || "",
    platform
  ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
}