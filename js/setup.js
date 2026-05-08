import { getAPIKey, setAPIKey } from '../config.js';

export async function initializeSetup() {
  const modal = document.getElementById('setupModal');
  const input = document.getElementById('apiKeyInput');
  const setupBtn = document.getElementById('setupButton');

  // Check if API key exists from .env or localStorage
  let apiKey = getAPIKey();

  if (!apiKey || apiKey.trim() === '') {
    // API key not found, show modal
    modal.classList.remove('hidden');
    
    setupBtn.addEventListener('click', handleSetupSubmit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSetupSubmit();
    });

    // Wait for user to submit
    return new Promise((resolve) => {
      window.setupResolve = resolve;
    });
  } else {
    // API key found, hide modal
    modal.classList.add('hidden');
    return Promise.resolve();
  }
}

function handleSetupSubmit() {
  const input = document.getElementById('apiKeyInput');
  const modal = document.getElementById('setupModal');
  const key = input.value.trim();

  if (!key) {
    alert('Please enter your API key');
    return;
  }

  if (!key.startsWith('AIza')) {
    alert('Invalid API key format. Gemini API keys start with "AIza"');
    return;
  }

  // Save the API key
  setAPIKey(key);
  localStorage.setItem('VITE_GEMINI_API_KEY', key);

  // Hide modal
  modal.classList.add('hidden');

  // Show success message
  console.log('✓ API key set successfully');

  // Resolve the promise if it exists
  if (window.setupResolve) {
    window.setupResolve();
  }
}
