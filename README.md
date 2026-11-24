# SayNest

A smart vocabulary nest: look up words, hear pronunciations in British, American and Australian accents, explore nuanced meanings, and save words to collections for audio review on your commute.

Built with React, Vite, Tailwind CSS and an Express server that talks to the Gemini API.

## Features

- **Word lookup** with IPA, syllable breakdown, meanings, usage nuance and CEFR level
- **Accent audio** for British, American and Australian English
- **Scan a page**: photograph a book page (or paste text) and get the words worth learning, with meanings, levels and the chapter and page they came from
- **Spaced review**: words come back for review just as you're about to forget them
- **Library** of books with cover search (Open Library, with a Google Books fallback)
- **Collections, review and commute mode** for practising saved words

## AI providers

SayNest uses AI for rich lookups and page scanning, trying providers in this order:

1. **Gemini 3.8 Flash** (free tier)
2. **Gemini 3.5 Flash-Lite** (free tier, stays fast when Flash is busy)
3. **OpenAI gpt-6-luna** (paid backup)
4. The free [Dictionary API](https://dictionaryapi.dev/), with more basic results

Each AI provider is optional and only used if its key is set. If a provider is busy or slow, SayNest moves to the next one within seconds and skips it for a minute.

## Run locally

**Prerequisites:** [Node.js](https://nodejs.org/) 22 or newer

1. Install dependencies:
   ```
   npm install
   ```
2. (Optional) Copy `.env.example` to a new file named `.env` and add your keys:
   ```
   GEMINI_API_KEY="your-gemini-key"
   OPENAI_API_KEY="your-openai-key"
   ```
   Get a free Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and an OpenAI key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). `.env` is ignored by git, so your keys are never committed.
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
- **Environment variables:** `NODE_ENV=production`, plus `GEMINI_API_KEY` and/or `OPENAI_API_KEY`

The server listens on the `PORT` the host provides, or 3000 by default.

## Accounts and syncing (Firebase)

Saved words, search history and collections are kept in the browser and, when
someone signs in, mirrored to Firestore so they match on every device.
Sign-in is Google or email + password (Firebase Authentication, free Spark plan).

Setup, once:

1. In the [Firebase console](https://console.firebase.google.com), create a
   project and add a **Web app**. Copy its `firebaseConfig` into
   [`src/firebaseConfig.ts`](src/firebaseConfig.ts). These values are public;
   they only identify the project.
2. **Authentication → Sign-in method**: enable **Google** and **Email/Password**.
3. **Authentication → Settings → Authorized domains**: add every address the app
   is served from (for example `saynest.me`, `www.saynest.me` and the
   `herokuapp.com` address). `localhost` is there already.
4. **Firestore Database**: create it, then set these **Rules**, so each person
   can only read and write their own data:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

While `firebaseConfig` is `null`, the sign-in button is hidden and everything
stays in the browser only.
