# MetaGen AI Data Generator

A small browser app for generating stock-style metadata from images with Gemini Vision.

## What it does

- Upload multiple images
- Generate title, description, keywords, mood, and suggested use
- Export finished metadata as CSV
- Supports platform-aware keyword counts

## Setup

1. Open [config.js](config.js) and set your Gemini API key.
2. Open [index.html](index.html) in a browser or run it from a local server.

## Notes

- The app currently targets Gemini Vision via the Google Generative Language API.
- For best results, use clear images and add extra context when needed.
- `Alamy` uses a lower keyword limit than the other platforms.
