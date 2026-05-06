# MetaGen - AI Data Generator

A simple browser app for generating stock-style metadata from images using Google's Gemini Vision API.

## Features

- 🖼️ Upload multiple images (drag & drop or click)
- 🤖 Auto-generate metadata (title, description, keywords, mood, suggested use)
- 📊 Support for multiple stock platforms (Adobe Stock, Shutterstock, Getty Images, iStock, Alamy)
- 💾 Export metadata as CSV
- ⚡ Fast analysis with Gemini 2.5 Flash

## Setup

### Local Development

1. **Clone the repository** (after pushing to GitHub):
```bash
git clone https://github.com/YOUR_USERNAME/metagen.git
cd metagen
```

2. **Set up API key**:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update `.env` with your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run locally**:
   - Open `index.html` directly in your browser, OR
   - Use a local server (recommended):
   ```bash
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

### Vercel Deployment

1. **Push to GitHub** (see instructions below)

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your `metagen` repository from GitHub
   - Click "Deploy"

3. **Set Environment Variable on Vercel**:
   - In Vercel dashboard: Project → Settings → Environment Variables
   - Add new variable:
     - Name: `VITE_GEMINI_API_KEY`
     - Value: Your Gemini API key
   - Click "Save"
   - Redeploy your project

## GitHub & Vercel Setup

### Push to GitHub

```powershell
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: MetaGen AI metadata generator"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/metagen.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Deploy to Vercel

1. Visit [vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Select the `metagen` repository
4. Leave all settings as default (static site)
5. Click "Deploy"
6. Add environment variables (see above)
7. Your site is live!

## API Configuration

- **Model**: Gemini 2.5 Flash
- **API Key**: Set via environment variable `VITE_GEMINI_API_KEY`
- **Max Keywords**: 50 (30 for Alamy)

## File Structure

```
metagen/
├── index.html          # Main HTML
├── config.js           # Configuration
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── css/
│   ├── style.css      # Main styles
│   └── animations.css # Animations
└── js/
    ├── app.js         # Main app logic
    ├── api.js         # Gemini API calls
    ├── state.js       # Image state management
    ├── upload.js      # File upload handling
    ├── export.js      # CSV export
    └── render.js      # UI rendering
```

## Notes

- Images are processed locally in your browser
- API key should never be committed to git (use `.env`)
- Maximum 20 images per session
- Each image takes 5-15 seconds to analyze

## Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Create a new API key in your Google Cloud project
4. Copy the key to your `.env` file or Vercel environment variables
