# SayNest

A smart vocabulary nest: look up words, hear pronunciations in British, American and Australian accents, explore nuanced meanings, and save words to collections for audio review on your commute.

Built with React, Vite, Tailwind CSS and an Express server that talks to the Gemini API.

## Features

- **Word lookup** with IPA, syllable breakdown, meanings, usage nuance and CEFR level
- **Accent audio** for British, American and Australian English
- **Scan a page** of a book to pull out vocabulary worth learning
- **Library** of books with cover search (Open Library, with a Google Books fallback)
- **Collections, review and commute mode** for practising saved words

Without a Gemini API key the app still works, using the free [Dictionary API](https://dictionaryapi.dev/) for lookups, but the results are more basic.

## Run locally

**Prerequisites:** [Node.js](https://nodejs.org/) 22 or newer

1. Install dependencies:
   ```
   npm install
   ```
2. (Optional) Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then create a file named `.env.local` in the project folder:
   ```
   GEMINI_API_KEY="your-key-here"
   ```
   `.env.local` is ignored by git, so your key is never committed.
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the server with live reloading |
| `npm run build` | Build the frontend into `dist/` |
| `npm start` | Start the server (serves `dist/` when `NODE_ENV=production`) |
| `npm run lint` | Type-check the project |
| `npm run clean` | Delete the `dist/` build output |

## Deploy

Any Node host works (for example Render or Railway):

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Environment variables:** `NODE_ENV=production` and `GEMINI_API_KEY`

The server listens on the `PORT` the host provides, or 3000 by default.
