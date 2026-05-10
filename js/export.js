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

  // Add BOM for Excel compatibility
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
  // Freepik format - optimized for successful upload and discoverability
  const headers = [
    "Filename",
    "Title",
    "Description",
    "Tags",
    "Category"
  ];
  
  const rows = done.map(({ file, meta: m }) => {
    // Freepik requires comma-separated tags
    const tags = (m.keywords || []).join(", ");
    
    return [
      file.name,
      m.title,
      m.description,
      tags,
      m.mood || "General"
    ].map(v => `"${String(v || "").replace(/"/g, '""')}"`);
  });

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
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