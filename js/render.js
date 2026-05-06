import { images, removeImage } from './state.js';
import { retryOne } from './api.js';

export function render() {
  const grid = document.getElementById("imageGrid");
  grid.innerHTML = "";
  images.forEach(img => grid.appendChild(buildCard(img)));
}

export function updateCard(img) {
  const el = document.getElementById(`card-${img.id}`);
  if (!el) return;
  el.className = `img-card ${img.state}`;
  el.innerHTML = cardHTML(img);
}

function buildCard(img) {
  const div = document.createElement("div");
  div.className = `img-card ${img.state}`;
  div.id = `card-${img.id}`;
  div.innerHTML = cardHTML(img);
  return div;
}

function cardHTML(img) {
  const m = img.meta;
  let body = "";
  if (img.state === "idle")      body = `<p class="img-state">Waiting…</p>`;
  if (img.state === "analyzing") body = `<p class="img-state">Analyzing…</p>`;
  if (img.state === "error")     body = `<p class="img-state error">Failed</p>
    <button onclick="retryOne(${img.id})">↺ Retry</button>`;
  if (img.state === "done" && m) {
    const keywords = Array.isArray(m.keywords) ? m.keywords : [];
    const shown = keywords.slice(0, 8);
    const rest  = keywords.length - 8;
    body = `
      <div class="meta-field"><div class="meta-label">Title</div><div>${esc(m.title)}</div></div>
      <div class="meta-field"><div class="meta-label">Description</div><div>${esc(m.description)}</div></div>
      <div class="meta-field"><div class="meta-label">Keywords (${keywords.length})</div>
        <div class="kw-wrap">
          ${shown.map(k => `<span class="kw">${esc(k)}</span>`).join("")}
          ${rest > 0 ? `<span class="kw-more">+${rest} more</span>` : ""}
        </div>
      </div>`;
  }
  return `
    <div class="img-thumb-wrap">
      <img class="img-thumb" src="${img.objectURL}" alt="">
      <button class="img-remove" onclick="removeImage(${img.id})">✕</button>
    </div>
    <div class="img-body">
      <div class="img-filename">${esc(img.file.name)}</div>
      ${body}
    </div>`;
}

function esc(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}