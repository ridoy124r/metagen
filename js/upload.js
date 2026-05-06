import { images, nextId, addImage } from './state.js';
import { render } from './render.js';
import { MAX_FILES } from '../config.js';

export function handleFiles(files) {
  const existing = new Set(images.map(f => signature(f.file)));
  const list = Array.from(files)
    .filter(f => f.type.startsWith("image/"))
    .filter(f => {
      const sig = signature(f);
      if (existing.has(sig)) return false;
      existing.add(sig);
      return true;
    })
    .slice(0, Math.max(0, MAX_FILES - images.length));

  list.forEach(file => {
    const img = {
      id: nextId(),
      file,
      objectURL: URL.createObjectURL(file),
      base64: null,
      mediaType: file.type,
      state: "idle",   
      meta: null
    };
    addImage(img);
    readBase64(img);   
  });
  render();
}

function readBase64(img) {
  const reader = new FileReader();
  reader.onload = () => { img.base64 = reader.result.split(",")[1]; };
  reader.readAsDataURL(img.file);
}

// Drag & drop wiring
export function onDragOver(e) {
  e.preventDefault();
  document.getElementById("dropZone").classList.add("dragover");
}
export function onDragLeave() {
  document.getElementById("dropZone").classList.remove("dragover");
}
export function onDrop(e) {
  e.preventDefault();
  document.getElementById("dropZone").classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
}

function signature(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}