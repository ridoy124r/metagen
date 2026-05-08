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
  // Adobe Stock format
  const headers = ["Filename", "Title", "Description", "Keywords", "Category", "Mood"];
  
  const rows = done.map(({ file, meta: m }) => [
    file.name,
    m.title,
    m.description,
    // Adobe Stock prefers space-separated keywords
    (m.keywords || []).join(" "),
    m.mood || "",
    m.suggested_use || ""
  ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));

  return [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
}

function generateFreepikCSV(done) {
  // Freepik format - more flexible with keywords
  const headers = ["Filename", "Title", "Description", "Tags", "License Type", "Category"];
  
  const rows = done.map(({ file, meta: m }) => [
    file.name,
    m.title,
    m.description,
    // Freepik accepts comma-separated or space-separated tags
    (m.keywords || []).join(", "),
    "Free", // Default license type
    m.mood || "General"
  ].map(v => `"${String(v || "").replace(/"/g, '""')}"`));

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