import { APP_NAME, API_KEY, DEFAULT_CATEGORY, DEFAULT_PLATFORM } from '../config.js';
import { handleFiles, onDragOver, onDragLeave, onDrop } from './upload.js';
import { images, removeImage, resetState } from './state.js';
import { render } from './render.js';
import { callAPI } from './api.js';
import { exportCSV } from './export.js';

const platformEl = document.getElementById('platform');
const categoryEl = document.getElementById('category');
const extraEl = document.getElementById('extra');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const csvBtn = document.getElementById('csvBtn');
const progressWrap = document.getElementById('progressWrap');
const progressText = document.getElementById('progressText');
const progressNum = document.getElementById('progressNum');
const progressFill = document.getElementById('progressFill');
const toast = document.getElementById('toast');
const fileCount = document.getElementById('fileCount');
let isAnalyzing = false;

platformEl.value = DEFAULT_PLATFORM;
categoryEl.value = DEFAULT_CATEGORY;

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  e.target.value = '';
});
dropZone.addEventListener('dragover', onDragOver);
dropZone.addEventListener('dragleave', onDragLeave);
dropZone.addEventListener('drop', onDrop);

analyzeBtn.addEventListener('click', analyzeAll);
clearBtn.addEventListener('click', clearAll);
csvBtn.addEventListener('click', () => exportCSV(platformEl.value));

window.removeImage = (id) => {
  removeImage(id);
  render();
  updateUI();
};

window.retryOne = async (id) => {
  await retryOne(id);
};

async function analyzeOne(img) {
  img.state = 'analyzing';
  render();
  console.log("Analyzing image:", img.id);
  
  try {
    const meta = await callAPI(img, getSettings());
    console.log("Got metadata for image", img.id, ":", meta);
    img.meta = meta;
    img.state = 'done';
    render();
  } catch (err) {
    console.error("Analyze error for image", img.id, ":", err);
    showToast(err.message || "Analysis failed");
    img.state = 'error';
    img.meta = null;
    render();
  }
}

async function retryOne(id) {
  const img = images.find(i => i.id === id);
  if (!img) return;
  await analyzeOne(img);
  updateUI();
}

async function analyzeAll() {
  if (!API_KEY || API_KEY === 'YOUR_GEMINI_KEY_HERE') {
    showToast('Add your Gemini API key in config.js first.');
    return;
  }

  const queue = images.filter(img => img.state !== 'analyzing' && img.state !== 'done');
  if (!queue.length) return;

  isAnalyzing = true;
  updateUI();
  progressWrap.style.display = 'block';

  for (let i = 0; i < queue.length; i++) {
    const img = queue[i];
    progressText.textContent = 'Analyzing...';
    progressNum.textContent = `${i + 1} / ${queue.length}`;
    progressFill.style.width = `${Math.round((i / queue.length) * 100)}%`;
    await analyzeOne(img);
    updateUI();
  }

  progressFill.style.width = '100%';
  progressText.textContent = 'Done';
  showToast('Metadata generated successfully.');
  isAnalyzing = false;
  updateUI();
}

function clearAll() {
  isAnalyzing = false;
  resetState();
  render();
  updateUI();
}

function getSettings() {
  return {
    platform: platformEl.value,
    category: categoryEl.value,
    extra: extraEl.value.trim(),
  };
}

function updateUI() {
  const count = images.length;
  fileCount.textContent = `${count} Image${count === 1 ? '' : 's'}`;
  analyzeBtn.disabled = count === 0 || isAnalyzing;
  csvBtn.disabled = !images.some(i => i.state === 'done' && i.meta);
  clearBtn.disabled = count === 0;
  progressWrap.style.display = count ? 'block' : 'none';

  const doneCount = images.filter(i => i.state === 'done').length;
  if (count) {
    progressNum.textContent = `${doneCount} / ${count}`;
    progressFill.style.width = `${Math.round((doneCount / count) * 100)}%`;
  } else {
    progressText.textContent = 'Ready';
    progressNum.textContent = '0 / 0';
    progressFill.style.width = '0%';
  }
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

window.addEventListener('beforeunload', () => {
  images.forEach(img => img.objectURL && URL.revokeObjectURL(img.objectURL));
});

platformEl.addEventListener('change', updateUI);
categoryEl.addEventListener('change', updateUI);
extraEl.addEventListener('input', updateUI);

render();
updateUI();
showToast(`${APP_NAME} is ready.`);