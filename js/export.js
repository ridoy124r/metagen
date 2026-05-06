import { images } from './state.js';

export function exportCSV(platform) {
  const done = images.filter(i => i.state === "done" && i.meta);
  if (!done.length) return;

  const headers = ["Filename","Title","Description","Keywords","Mood","Suggested Use","Platform"];
  const rows = done.map(({ file, meta: m }) => [
    file.name, m.title, m.description,
    (m.keywords || []).join("; "),
    m.mood, m.suggested_use, platform
  ].map(v => `"${String(v || "").replace(/"/g,'""')}"`));

  const csv = [headers.map(h=>`"${h}"`).join(","), ...rows.map(r=>r.join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" }));
  Object.assign(document.createElement("a"), { href:url, download:`metadata-${Date.now()}.csv` }).click();
  URL.revokeObjectURL(url);
}