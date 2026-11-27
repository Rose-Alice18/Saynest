import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { firebaseConfig } from './src/firebaseConfig';

// .env.local (your private keys) takes priority over .env
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const app = express();
const port = Number(process.env.PORT) || 3000;

// Live, send plain http:// visits to https:// (Heroku's router says which one
// was used in x-forwarded-proto). Also needed for sign-in and the microphone,
// which browsers only allow on secure pages.
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    // One address for the site, so Google sign-in only needs it registered once
    if (req.headers.host === 'www.saynest.me') {
      return res.redirect(301, `https://saynest.me${req.originalUrl}`);
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// Google sign-in helper pages
//
// Firebase's sign-in step runs on <project>.firebaseapp.com. Safari on iPhone
// keeps each site's storage separate, so when that page hands back to
// saynest.me the sign-in "state" is missing and it fails. Serving those pages
// from our own address (Firebase's recommended fix) keeps it all on one site.
const FIREBASE_AUTH_ORIGIN = 'https://saynest.firebaseapp.com';
// Firebase Hosting normally serves this file; we don't use Hosting, so serve it
// here from the same public web config the app uses
app.get('/__/firebase/init.json', (req, res) => {
  if (!firebaseConfig) return res.status(404).json({ error: 'Firebase is not configured' });
  res.json({ ...firebaseConfig, authDomain: req.headers.host || firebaseConfig.authDomain });
});
app.all(['/__/auth/*', '/__/firebase/*'], express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  try {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value !== 'string') continue;
      if (['host', 'connection', 'content-length', 'accept-encoding'].includes(key)) continue;
      if (key.startsWith('x-forwarded') || key === 'x-request-id' || key === 'x-request-start' || key === 'via') continue;
      headers[key] = value;
    }
    const hasBody = !['GET', 'HEAD'].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0;
    const upstream = await fetch(FIREBASE_AUTH_ORIGIN + req.originalUrl, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: 'manual'
    });
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) return;
      res.setHeader(key, value);
    });
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error('Sign-in helper proxy failed:', err);
    res.status(502).send('Sign-in is unavailable right now. Please try again.');
  }
});

// Page photos are sent as base64 JSON, so that one route allows a larger body.
// Everything else keeps Express's small default.
const smallJson = express.json();
const photoJson = express.json({ limit: '8mb' });
app.use((req, res, next) =>
  (req.path === '/api/scan-image' || req.path === '/api/transcribe' ? photoJson : smallJson)(req, res, next)
);

// ---------------------------------------------------------------------------
// AI providers
//
// Each provider takes a prompt and returns the model's JSON text. They are
// tried in order; if one is busy, slow or errors, the next one is used. A
// provider is only enabled when its API key is set, so every one is optional.
// If all of them fail, the endpoints fall back to the free Dictionary API.
// ---------------------------------------------------------------------------

// Per-request time limit, so a busy provider can't leave a user waiting.
const AI_TIMEOUT_MS = 10_000;

type AiImage = { mimeType: string; data: string }; // data is base64
type AiRequest = { prompt: string; image?: AiImage; timeoutMs: number };
type AiProvider = { name: string; generate: (req: AiRequest) => Promise<string | undefined> };
const aiProviders: AiProvider[] = [];

// Gemini (free tier). Best model first; Flash-Lite stays fast when Flash is busy.
if (process.env.GEMINI_API_KEY) {
  const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    // The SDK default is 5 attempts with up to 60s between them, which left
    // lookups hanging for 90s+. Moving on to the next provider is our retry.
    httpOptions: { timeout: AI_TIMEOUT_MS, retryOptions: { attempts: 1 } },
  });
  for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash-lite']) {
    aiProviders.push({
      name: model,
      generate: async ({ prompt, image, timeoutMs }) => {
        const response = await gemini.models.generateContent({
          model,
          contents: image
            ? [{ role: 'user', parts: [{ inlineData: image }, { text: prompt }] }]
            : prompt,
          config: {
            responseMimeType: 'application/json',
            httpOptions: { timeout: timeoutMs, retryOptions: { attempts: 1 } },
          },
        });
        return response.text;
      },
    });
  }
}

// OpenAI (paid, used as a backup when Gemini is unavailable).
if (process.env.OPENAI_API_KEY) {
  const model = process.env.OPENAI_MODEL || 'gpt-6-luna';
  // Lookups don't need deep reasoning. With 'none', gpt-6-luna answers the
  // lookup prompt in ~7s instead of ~18s, with the same output quality.
  // Not every model accepts this setting, so it's only sent by default for
  // gpt-6-luna; set OPENAI_REASONING_EFFORT to use it with another model.
  const reasoningEffort =
    process.env.OPENAI_REASONING_EFFORT || (model === 'gpt-6-luna' ? 'none' : undefined);
  aiProviders.push({
    name: model,
    generate: async ({ prompt, image, timeoutMs }) => {
      const content = image
        ? [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.data}` } },
          ]
        : prompt;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content }],
          response_format: { type: 'json_object' },
          ...(reasoningEffort && { reasoning_effort: reasoningEffort }),
        }),
        // Last AI option before the dictionary, so it gets a little longer.
        signal: AbortSignal.timeout(timeoutMs * 2),
      });
      if (!res.ok) throw Object.assign(new Error(`OpenAI HTTP ${res.status}`), { status: res.status });
      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    },
  });
}

console.log(
  aiProviders.length
    ? `AI providers (in order): ${aiProviders.map((p) => p.name).join(' -> ')}`
    : 'No AI keys set; using the free Dictionary API only'
);

// After a provider fails (busy, timed out, etc.), skip it for a while so
// every request doesn't wait for it to fail again before moving on.
const AI_COOLDOWN_MS = 60_000;
const cooldownUntil = new Map<string, number>();

// Ask the AI providers for a JSON answer, trying each in turn.
// Returns null if none are available so callers can use their fallback.
async function generateJson(
  prompt: string,
  options: { image?: AiImage; timeoutMs?: number } = {}
): Promise<any | null> {
  const request: AiRequest = { prompt, image: options.image, timeoutMs: options.timeoutMs ?? AI_TIMEOUT_MS };
  const now = Date.now();
  const ready = aiProviders.filter((p) => (cooldownUntil.get(p.name) ?? 0) <= now);
  // If every provider is cooling down, try them all anyway rather than none.
  for (const provider of ready.length ? ready : aiProviders) {
    try {
      const text = await provider.generate(request);
      if (text) {
        cooldownUntil.delete(provider.name);
        return JSON.parse(text);
      }
    } catch (err: any) {
      cooldownUntil.set(provider.name, Date.now() + AI_COOLDOWN_MS);
      console.warn(
        `AI ${provider.name} failed (${err?.status ?? err?.name ?? 'error'}), skipping it for ${AI_COOLDOWN_MS / 1000}s`
      );
    }
  }
  return null;
}

// Many recording links the Dictionary API returns now point at deleted files
// (404). Only keep links that actually load, so the app goes straight to the
// browser voice instead of trying a dead file first.
//
// Checking is slow (the host takes 1-3s to report a missing file), so:
// - each link's result is remembered, so repeat words are instant
// - after several missing files in a row we assume the recordings are down
//   and stop checking for a while, rather than slowing every lookup
const audioCheckCache = new Map<string, boolean>();
const AUDIO_DOWN_AFTER_MISSES = 6;
const AUDIO_RECHECK_AFTER_MS = 30 * 60_000;
let audioMissStreak = 0;
let audioSkipUntil = 0;

async function audioExists(url: string): Promise<boolean> {
  const cached = audioCheckCache.get(url);
  if (cached !== undefined) return cached;
  if (Date.now() < audioSkipUntil) return false;

  let ok = false;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
    ok = res.ok && (res.headers.get('content-type') || '').startsWith('audio/');
    audioCheckCache.set(url, ok);
  } catch {
    // Timeout or network error: treat as missing, but don't remember it,
    // since the file might load fine next time
  }

  audioMissStreak = ok ? 0 : audioMissStreak + 1;
  if (audioMissStreak >= AUDIO_DOWN_AFTER_MISSES) {
    audioSkipUntil = Date.now() + AUDIO_RECHECK_AFTER_MS;
    audioMissStreak = 0;
    console.warn('Dictionary recordings look unavailable; using browser voices for 30 minutes');
  }
  return ok;
}

// Fetch authentic audio from Free Dictionary API if available with timeout
async function fetchDictionaryAudio(word: string): Promise<{
  ukAudio?: string;
  usAudio?: string;
  auAudio?: string;
  phonetics?: any[];
  rawDefinitions?: any[];
}> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`, {
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return {};
    
    const entry = data[0];

    // Recording files are named by accent, e.g. hello-uk.mp3, run-au.mp3.
    // Match the tag exactly so an Australian file is never labelled American.
    const byAccent: Record<'uk' | 'us' | 'au', string | undefined> = { uk: undefined, us: undefined, au: undefined };
    for (const p of entry.phonetics || []) {
      const tag = p.audio?.match(/-(uk|us|au)\.mp3$/i)?.[1]?.toLowerCase() as 'uk' | 'us' | 'au' | undefined;
      if (tag && !byAccent[tag]) byAccent[tag] = p.audio;
    }
    const [ukAudio, usAudio, auAudio] = await Promise.all(
      (['uk', 'us', 'au'] as const).map(async (tag) => {
        const url = byAccent[tag];
        return url && (await audioExists(url)) ? url : undefined;
      })
    );

    return {
      ukAudio,
      usAudio,
      auAudio,
      phonetics: entry.phonetics || [],
      rawDefinitions: entry.meanings || []
    };
  } catch (err) {
    console.warn('Dictionary API error:', err);
    return {};
  }
}

// Word Lookup endpoint
app.get('/api/lookup', async (req, res) => {
  const query = req.query.word as string;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }

  const word = query.trim();
  const dictData = await fetchDictionaryAudio(word);

  // ?quick=1 skips the AI so the app can show the dictionary result in about
  // a second, then ask again without quick=1 for the richer AI version.
  const quick = req.query.quick === '1';
  // ?exact=1 means "I really meant this spelling", so don't correct it
  const exact = req.query.exact === '1';
  const notInDictionary = !dictData.rawDefinitions || dictData.rawDefinitions.length === 0;

  // If an AI provider is configured, use it for deep nuanced linguistics
  if (!quick && aiProviders.length > 0) {
    try {
      const prompt = `You are the master lexicographer behind the SayNest pronunciation and vocabulary app.
Provide a rich, precise JSON analysis for the word or phrase: "${word}".
${notInDictionary && !exact ? `The standard dictionary has NO entry for "${word}", so it may be misspelt.
If it is a misspelling or typo of a real English word or phrase (e.g. "tird" -> "tired", "recieve" -> "receive", "definately" -> "definitely"),
analyse the INTENDED word instead, put it in "word", and set "spellingFix" to {"from": "${word}", "to": "<intended word>"}.
Only keep "${word}" as typed if it is a genuine word or phrase listed in Oxford, Cambridge or Merriam-Webster, or a well-known idiom or slang term; then set "spellingFix" to null.
Never invent a meaning for a word that doesn't exist.
` : ''}Return ONLY valid JSON with this exact schema:
{
  "word": "${word}",
  "spellingFix": null,
  "type": "word" | "transition" | "phrase",
  "phonetic": "Primary IPA transcription e.g. /'mɪm.ɪk/ or /ˌæk.wi'es/",
  "syllables": "Syllable breakdown e.g. MI-mik or ak-wee-ES",
  "accents": [
    {
      "accent": "British",
      "ipa": "British IPA e.g. /'mɪm.ɪk/",
      "flag": "🇬🇧",
      "langCode": "en-GB"
    },
    {
      "accent": "American",
      "ipa": "American IPA e.g. /ˈmɪm.ɪk/",
      "flag": "🇺🇸",
      "langCode": "en-US"
    },
    {
      "accent": "Australian",
      "ipa": "Australian IPA e.g. /ˈmɪm.ɪk/",
      "flag": "🇦🇺",
      "langCode": "en-AU"
    }
  ],
  "meanings": [
    {
      "partOfSpeech": "verb" | "noun" | "adjective" | "adverb" | "transition",
      "definitions": [
        {
          "definition": "Clear concise primary definition",
          "example": "Natural, evocative example sentence demonstrating real usage"
        }
      ]
    }
  ],
  "nuance": {
    "bestUsedWhen": ["Point 1 for when to use", "Point 2"],
    "avoidWhen": ["Point 1 for when not to use or common confusion"],
    "formality": "Formal" | "Neutral" | "Informal" | "Literary",
    "cefr": "B1" | "B2" | "C1" | "C2"
  },
  "relatedExpressions": [
    { "phrase": "Related phrase 1", "type": "synonym or related transition", "relation": "subtle difference" }
  ]
}`;

      const parsed = await generateJson(prompt);
      if (parsed) {
        // Keep a correction only if it really changed the word
        const fixedTo = typeof parsed.spellingFix?.to === 'string' ? parsed.spellingFix.to.trim() : '';
        if (!fixedTo || fixedTo.toLowerCase() === word.toLowerCase()) {
          parsed.spellingFix = null;
        } else {
          parsed.spellingFix = { from: word, to: fixedTo };
          parsed.word = fixedTo;
          // Recordings belong to the corrected word, not the typo
          Object.assign(dictData, await fetchDictionaryAudio(fixedTo));
        }
        // Attach audio files if found
        if (parsed.accents) {
          for (const acc of parsed.accents) {
            if (acc.accent === 'British' && dictData.ukAudio) {
              acc.audioUrl = dictData.ukAudio;
            } else if (acc.accent === 'American' && dictData.usAudio) {
              acc.audioUrl = dictData.usAudio;
            } else if (acc.accent === 'Australian' && dictData.auAudio) {
              acc.audioUrl = dictData.auAudio;
            }
          }
        }
        return res.json({ ...parsed, source: 'ai' });
      }
    } catch (geminiErr) {
      console.error('Gemini lookup error, falling back:', geminiErr);
    }
  }

  // Fallback using raw dictionary data
  if (dictData.rawDefinitions && dictData.rawDefinitions.length > 0) {
    const meanings = dictData.rawDefinitions.map((m: any) => ({
      partOfSpeech: m.partOfSpeech || 'word',
      definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({
        definition: d.definition,
        example: d.example || `The term "${word}" is frequently employed in this sense.`
      }))
    }));

    const primaryPhonetic = dictData.phonetics?.find((p: any) => p.text)?.text || `/${word}/`;

    return res.json({
      word,
      type: 'word',
      phonetic: primaryPhonetic,
      syllables: word.toUpperCase(),
      accents: [
        {
          accent: 'British',
          ipa: primaryPhonetic,
          audioUrl: dictData.ukAudio,
          flag: '🇬🇧',
          langCode: 'en-GB'
        },
        {
          accent: 'American',
          ipa: primaryPhonetic,
          audioUrl: dictData.usAudio,
          flag: '🇺🇸',
          langCode: 'en-US'
        },
        {
          accent: 'Australian',
          ipa: primaryPhonetic,
          audioUrl: dictData.auAudio,
          flag: '🇦🇺',
          langCode: 'en-AU'
        }
      ],
      meanings,
      nuance: {
        bestUsedWhen: [`Employed for precision when expressing "${word}".`],
        avoidWhen: ['Using out of proper grammatical context.'],
        formality: 'Neutral',
        cefr: 'B2'
      },
      relatedExpressions: [],
      source: 'dictionary'
    });
  }

  // Minimal algorithmic fallback
  return res.json({
    source: 'fallback',
    word,
    type: 'word',
    phonetic: `/${word}/`,
    syllables: word.toUpperCase(),
    accents: [
      { accent: 'British', ipa: `/${word}/`, flag: '🇬🇧', langCode: 'en-GB' },
      { accent: 'American', ipa: `/${word}/`, flag: '🇺🇸', langCode: 'en-US' },
      { accent: 'Australian', ipa: `/${word}/`, flag: '🇦🇺', langCode: 'en-AU' }
    ],
    meanings: [
      {
        partOfSpeech: 'word',
        definitions: [
          {
            definition: `Expression or concept of "${word}".`,
            example: `She noted down "${word}" to investigate its subtle connotations.`
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: ['Refining vocabulary and expanding personal discourse.'],
      formality: 'Neutral'
    }
  });
});

// Scan text endpoint
app.post('/api/scan', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text content is required' });
  }

  if (aiProviders.length > 0) {
    try {
      const prompt = `You are the reader assistant for SayNest.
Analyze the following book excerpt or text paragraph:
"""${text}"""

Identify 3 to 6 sophisticated vocabulary words, idioms, or transitions present in the text that an eager reader would want to collect and learn.
For each item return:
- word (or phrase)
- partOfSpeech
- briefMeaning
- contextSentence (from or inspired by the excerpt)
- cefr (e.g. B2, C1, C2)

Return ONLY valid JSON:
{
  "extractedWords": [
    {
      "word": "...",
      "partOfSpeech": "...",
      "briefMeaning": "...",
      "contextSentence": "...",
      "cefr": "..."
    }
  ]
}`;

      const parsed = await generateJson(prompt);
      if (parsed) {
        return res.json(parsed);
      }
    } catch (err) {
      console.warn('Scan text AI error:', err);
    }
  }

  // Fallback when no AI is available: longer words, skipping names, each with
  // the sentence it appears in. No made-up meaning; the app offers "Define".
  const sentences = text.split(/(?<=[.!?;])\s+/);
  const seen = new Set<string>();
  const picks: { word: string; contextSentence: string }[] = [];
  for (const sentence of sentences) {
    for (const raw of sentence.split(/\s+/)) {
      const token = raw.replace(/[^A-Za-z'-]/g, '');
      const isLikelyName = /^[A-Z]/.test(token) && !sentence.trim().startsWith(token);
      const lower = token.toLowerCase();
      if (token.length > 6 && !isLikelyName && !seen.has(lower)) {
        seen.add(lower);
        picks.push({ word: lower, contextSentence: sentence.trim() });
      }
    }
  }
  return res.json({ extractedWords: picks.slice(0, 6) });
});

// Scan a photo of a book page: read the text and pick out words to learn.
// The client shrinks photos before sending, so they're well under the limit.
const MAX_PHOTO_BASE64 = 7 * 1024 * 1024;

app.post('/api/scan-image', async (req, res) => {
  const { image, mimeType } = req.body || {};
  if (typeof image !== 'string' || !image || typeof mimeType !== 'string' || !/^image\/(jpeg|png|webp)$/.test(mimeType)) {
    return res.status(400).json({ error: 'Send a JPEG, PNG or WebP photo.' });
  }
  if (image.length > MAX_PHOTO_BASE64) {
    return res.status(413).json({ error: 'That photo is too large. Try a smaller one.' });
  }
  if (aiProviders.length === 0) {
    return res.status(503).json({ error: 'Page scanning needs an AI key. Add GEMINI_API_KEY to use it.' });
  }

  const prompt = `You are the reading assistant for SayNest, a vocabulary app.
The image is a photo of a page from a book, article or document.

1. Transcribe the main body text exactly as printed (keep paragraph breaks; skip running headers, footers and page numbers).
2. Pick 3 to 8 words, phrases, idioms or transitions from that text that an eager reader would want to learn. Prefer less common or nuanced items; skip names of people and places.
3. Note the page number and chapter if they are printed on the page.

If the image has no readable text, return an empty pageText and an empty extractedWords list.

Return ONLY valid JSON:
{
  "pageText": "...",
  "pageNumber": "112 or null",
  "chapter": "VII or null",
  "extractedWords": [
    {
      "word": "exactly as it appears, in lowercase unless a proper noun",
      "partOfSpeech": "...",
      "briefMeaning": "short plain-English meaning in this context",
      "contextSentence": "the full sentence from the page containing it",
      "cefr": "B2 | C1 | C2"
    }
  ]
}`;

  // Reading a photo takes longer than a word lookup
  const result = await generateJson(prompt, { image: { mimeType, data: image }, timeoutMs: 20_000 });
  if (!result) {
    return res.status(503).json({ error: 'The page reader is busy right now. Please try again in a minute.' });
  }
  const clean = (v: unknown) => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : undefined);
  return res.json({
    pageText: typeof result.pageText === 'string' ? result.pageText : '',
    pageNumber: clean(result.pageNumber),
    chapter: clean(result.chapter),
    extractedWords: Array.isArray(result.extractedWords) ? result.extractedWords.filter((w: any) => w?.word) : [],
  });
});

// ---------------------------------------------------------------------------
// Book search
//
// Open Library's title search finds the right book far more reliably than its
// general search (which is slow and matches loosely, e.g. "Bible" for "From
// Third World to First"). Both run together and results are ranked by how
// closely their title matches what was typed. If nothing matches well (typos,
// "3rd" for "third"...), the AI works out which book was meant and we search
// again for that. Google Books is a last resort: its free quota is shared and
// often used up.

interface FoundBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  year?: number | string;
  pageCount: number;
  editions?: number;
}

const ORDINALS: Record<string, string> = {
  '1st': 'first', '2nd': 'second', '3rd': 'third', '4th': 'fourth', '5th': 'fifth',
  '6th': 'sixth', '7th': 'seventh', '8th': 'eighth', '9th': 'ninth', '10th': 'tenth'
};
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'to', 'in', 'on', 'by', 'for', 'book']);
const bookTokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ORDINALS[t] || t);

/** 0..1: how much of the search the title covers, and how much of the title the search covers */
function titleMatch(title: string, author: string, query: string): number {
  const q = bookTokens(query).filter((t) => !STOP.has(t));
  const t = new Set(bookTokens(title).filter((x) => !STOP.has(x)));
  const a = new Set(bookTokens(author));
  if (!q.length || !t.size) return 0;
  const inTitle = q.filter((x) => t.has(x)).length;
  const inAuthor = q.filter((x) => !t.has(x) && a.has(x)).length;
  const coverage = (inTitle + inAuthor) / q.length; // search words found in title/author
  const precision = inTitle / t.size; // title words the search asked for
  // Both must be high: a 200-word 17th-century title that happens to contain
  // every search word is not a match
  return coverage * (0.4 + 0.6 * Math.min(1, precision * 1.5));
}

async function openLibrarySearch(params: Record<string, string>, limit = 10): Promise<FoundBook[]> {
  const qs = new URLSearchParams({
    ...params,
    limit: String(limit),
    fields: 'key,title,subtitle,author_name,first_publish_year,cover_i,edition_count,number_of_pages_median,isbn'
  });
  try {
    const r = await fetch(`https://openlibrary.org/search.json?${qs}`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'SayNest/1.0 (vocabulary app)' }
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.docs || []).map((doc: any) => ({
      id: String(doc.key || '').replace('/works/', '') || `ol-${Math.random()}`,
      title: doc.subtitle && !String(doc.title).includes(':') ? `${doc.title}: ${doc.subtitle}` : doc.title,
      author: Array.isArray(doc.author_name) && doc.author_name[0] ? doc.author_name[0] : 'Unknown author',
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : doc.isbn?.[0]
          ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg?default=false`
          : undefined,
      year: doc.first_publish_year,
      pageCount: doc.number_of_pages_median || 300,
      editions: doc.edition_count || 1
    }));
  } catch {
    return [];
  }
}

async function googleBooksSearch(query: string): Promise<FoundBook[]> {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`, {
      signal: AbortSignal.timeout(6000)
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.items || []).map((item: any) => {
      const info = item.volumeInfo || {};
      const cover = (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '').replace('http://', 'https://');
      return {
        id: item.id || `gb-${Math.random()}`,
        title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title || query,
        author: info.authors?.[0] || 'Unknown author',
        coverUrl: cover || undefined,
        year: info.publishedDate ? info.publishedDate.slice(0, 4) : undefined,
        pageCount: info.pageCount || 300,
        editions: 1
      };
    });
  } catch {
    return [];
  }
}

/** Rank by title match, then prefer books with covers and many editions (the well-known one) */
function rankBooks(books: FoundBook[], query: string): (FoundBook & { score: number })[] {
  const seen = new Set<string>();
  return books
    .map((b) => ({
      ...b,
      score:
        titleMatch(b.title, b.author, query) +
        (b.coverUrl ? 0.05 : 0) +
        // The famous book has hundreds of editions; adaptations and study guides have few
        Math.min(0.25, Math.log10((b.editions || 1) + 1) * 0.08)
    }))
    .sort((a, b) => b.score - a.score)
    .filter((b) => {
      const key = `${bookTokens(b.title).join(' ')}|${bookTokens(b.author).join(' ')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

app.get('/api/books/search', async (req, res) => {
  const query = ((req.query.q as string) || '').trim();
  if (!query) return res.status(400).json({ error: 'Search query is required' });
  const normalised = bookTokens(query).join(' ');

  // "Title by Author" searches both fields
  const byMatch = query.match(/^(.+?)\s+by\s+(.+)$/i);
  const searches = [
    openLibrarySearch(byMatch ? { title: byMatch[1], author: byMatch[2] } : { title: normalised }),
    openLibrarySearch({ q: normalised }, 8)
  ];
  let ranked = rankBooks((await Promise.all(searches)).flat(), query);

  // Nothing close: ask the AI which book was meant, then search for that
  if ((!ranked.length || ranked[0].score < 0.6) && aiProviders.length > 0) {
    try {
      const guess = await generateJson(
        `Someone is looking for a book and typed: "${query}". It may have typos, abbreviations or words out of order.
Which published book do they most likely mean? Return ONLY JSON: {"title": "exact book title", "author": "author's full name"}.
If you can't tell, return {"title": "", "author": ""}.`,
        { timeoutMs: 8000 }
      );
      console.log(`Book search: "${query}" looks like`, JSON.stringify(guess));
      if (guess?.title) {
        const again = await openLibrarySearch(
          guess.author ? { title: guess.title, author: guess.author } : { title: guess.title },
          8
        );
        const reranked = rankBooks([...again, ...ranked], `${guess.title} ${guess.author || ''}`);
        if (reranked.length) ranked = reranked;
      }
    } catch (err) {
      console.warn('Book guess failed:', err);
    }
  }

  if (!ranked.length) ranked = rankBooks(await googleBooksSearch(query), query);

  const books = ranked
    .filter((b, i) => i === 0 || b.score >= 0.35) // drop the clearly unrelated ones
    .slice(0, 8)
    .map(({ score, editions, ...b }) => b);

  if (books.length) return res.json({ books });
  // No match anywhere: offer to add it as typed
  return res.json({
    books: [{ id: `book-${Date.now()}`, title: query, author: 'Unknown author', coverUrl: undefined, pageCount: 200 }],
    notFound: true
  });
});

// ---------------------------------------------------------------------------
// Words from a link (TikTok, YouTube, Instagram, articles...)
//
// We can't watch the video, but the caption or page title usually names the
// word being taught ("Word of the day: ubiquitous"). Read that, then let the
// AI pick out the words or phrases the post is about.

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

/** Only public web addresses: no localhost, raw IPs or internal names */
function isPublicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase();
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
    if (/^[\d.]+$/.test(host) || host.includes(':')) return null; // IPv4 / IPv6 literals
    return u;
  } catch {
    return null;
  }
}

/** Fetch a page as text, following redirects, and stop reading after ~1.5 MB */
async function fetchPageText(url: string): Promise<{ finalUrl: string; html: string }> {
  const r = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html,*/*' }
  });
  const finalUrl = r.url || url;
  if (!isPublicUrl(finalUrl)) throw new Error('Redirected somewhere private');
  const reader = r.body?.getReader();
  if (!reader) return { finalUrl, html: '' };
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < 1_500_000) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  return { finalUrl, html: Buffer.concat(chunks).toString('utf8') };
}

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u([\dA-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"');

const metaContent = (html: string, prop: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)`, 'i'))?.[1] ||
  html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'))?.[1];

/** The words describing a post or page: its caption, title and description */
async function readLinkText(url: URL): Promise<{ site: string; text: string; finalUrl: string }> {
  const host = url.hostname.replace(/^www\./, '');
  const parts: string[] = [];
  let site = host;
  let finalUrl = url.toString();

  if (/(^|\.)tiktok\.com$/.test(host)) {
    site = 'TikTok';
    const page = await fetchPageText(url.toString()).catch(() => null);
    if (page) {
      finalUrl = page.finalUrl;
      // The caption sits in the page's data as "desc":"..."
      const desc = page.html.match(/"desc":"((?:[^"\\]|\\.){1,2200})"/)?.[1];
      if (desc) parts.push(decodeEntities(desc));
    }
    try {
      const o = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': BROWSER_UA }
      });
      if (o.ok) {
        const j: any = await o.json();
        if (j.title) parts.push(j.title);
      }
    } catch {}
  } else if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) {
    site = 'YouTube';
    try {
      const o = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`, {
        signal: AbortSignal.timeout(6000)
      });
      if (o.ok) {
        const j: any = await o.json();
        if (j.title) parts.push(j.title);
      }
    } catch {}
    const page = await fetchPageText(url.toString()).catch(() => null);
    const desc = page && metaContent(page.html, 'og:description');
    if (desc) parts.push(decodeEntities(desc));
  } else {
    if (/instagram\.com$/.test(host)) site = 'Instagram';
    else if (/(^|\.)(x|twitter)\.com$/.test(host)) site = 'X';
    const page = await fetchPageText(url.toString()).catch(() => null);
    if (page) {
      finalUrl = page.finalUrl;
      const title = metaContent(page.html, 'og:title') || page.html.match(/<title[^>]*>([^<]*)/i)?.[1];
      const desc = metaContent(page.html, 'og:description') || metaContent(page.html, 'description');
      if (title) parts.push(decodeEntities(title));
      if (desc) parts.push(decodeEntities(desc));
    }
  }
  let text = [...new Set(parts.map((p) => p.trim()).filter(Boolean))].join('\n').slice(0, 3000);
  // Bot-check pages (Cloudflare etc.) aren't the post: treat the link as unreadable
  if (/^(just a moment|attention required|access denied|please enable (javascript|cookies)|verify you are human)/i.test(text)) text = '';
  return { site, text, finalUrl };
}

app.get('/api/link-words', async (req, res) => {
  const url = isPublicUrl(String(req.query.url || ''));
  if (!url) return res.status(400).json({ error: 'That doesn’t look like a web link.' });
  // Some apps share the caption along with the link; use it too
  const sharedText = String(req.query.text || '').slice(0, 1000);

  const { site, text, finalUrl } = await readLinkText(url);
  const context = [sharedText, text].filter(Boolean).join('\n');
  if (!context.trim()) {
    return res.json({ site, url: finalUrl, caption: '', words: [], reason: 'unreadable' });
  }

  let words: { word: string; meaning?: string }[] = [];
  if (aiProviders.length > 0) {
    try {
      const result = await generateJson(
        `A language learner shared a ${site} post to their vocabulary app. Here is its caption / title / description:
"""
${context}
"""
Which English words, phrases or expressions is this post teaching or about? Ignore hashtags like #fyp, usernames, emojis and filler.
Return ONLY JSON: {"words": [{"word": "the word or phrase in lower case unless it's a name", "meaning": "a short meaning if the post gives one, else empty"}]}
List at most 6, most important first. If the post isn't about any particular word or phrase, return {"words": []}.`,
        { timeoutMs: 12000 }
      );
      if (Array.isArray(result?.words)) {
        words = result.words
          .filter((w: any) => typeof w?.word === 'string' && w.word.trim() && w.word.trim().split(/\s+/).length <= 6)
          .slice(0, 6)
          .map((w: any) => ({ word: w.word.trim(), meaning: typeof w.meaning === 'string' && w.meaning.trim() ? w.meaning.trim() : undefined }));
      }
    } catch (err) {
      console.warn('Link word extraction failed:', err);
    }
  }
  if (!words.length) {
    // No AI answer: words in quotes, or after "word of the day:"
    const quoted = [...context.matchAll(/[“"']([A-Za-z][A-Za-z' -]{2,40})[”"']/g)].map((m) => m[1]);
    const wotd = context.match(/word of the day[:\s-]+([A-Za-z][A-Za-z'-]{2,30})/i)?.[1];
    words = [...new Set([wotd, ...quoted].filter(Boolean) as string[])].slice(0, 6).map((word) => ({ word }));
  }
  res.json({ site, url: finalUrl, caption: text.slice(0, 500), words });
});

// ---------------------------------------------------------------------------
// Accurate voice search
//
// Phones' built-in speech recognition often mishears phrases ("drill stars
// around my car" for "you drew stars around my scars"). When an OpenAI key is
// set, the app records a few seconds of audio and we send it to OpenAI's
// transcription models instead. A few seconds cost a fraction of a cent.
const TRANSCRIBE_MODELS = [process.env.OPENAI_TRANSCRIBE_MODEL, 'gpt-4o-mini-transcribe', 'gpt-4o-transcribe', 'whisper-1'].filter(
  Boolean
) as string[];
let workingTranscribeModel: string | null = null;

app.get('/api/transcribe/status', (_req, res) => {
  res.json({ available: !!process.env.OPENAI_API_KEY });
});

app.post('/api/transcribe', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Accurate voice search is not set up.' });
  const { audio, mimeType } = req.body || {};
  if (typeof audio !== 'string' || !audio) return res.status(400).json({ error: 'No recording was sent.' });
  const type = typeof mimeType === 'string' && /^audio\/[\w.+-]+/.test(mimeType) ? mimeType.split(';')[0] : 'audio/webm';
  const bytes = Buffer.from(audio, 'base64');
  if (bytes.length < 1000) return res.status(400).json({ error: "That recording was too short. Hold the mic and speak a little longer." });
  if (bytes.length > 6_000_000) return res.status(413).json({ error: 'That recording was too long. Keep it under a minute.' });
  const ext = type.includes('mp4') || type.includes('m4a') || type.includes('aac') ? 'm4a' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : type.includes('mpeg') ? 'mp3' : 'webm';

  const models = workingTranscribeModel ? [workingTranscribeModel] : TRANSCRIBE_MODELS;
  for (const model of models) {
    try {
      const form = new FormData();
      form.append('file', new Blob([bytes], { type }), `speech.${ext}`);
      form.append('model', model);
      form.append('language', 'en');
      // Tells the model what kind of thing is being said, which helps with rare words
      form.append(
        'prompt',
        'Someone is saying an English word, phrase, idiom, quote or line of a song or poem to look it up in a dictionary.'
      );
      const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(20000)
      });
      if (r.status === 404 || r.status === 400) {
        // Model not available on this account (or unsupported audio): try the next one
        const detail = await r.text();
        console.warn(`Transcription with ${model} failed (${r.status}): ${detail.slice(0, 200)}`);
        if (r.status === 400 && !/model/i.test(detail)) {
          return res.status(400).json({ error: "We couldn't read that recording. Try again, or type the word." });
        }
        continue;
      }
      if (!r.ok) {
        console.warn(`Transcription with ${model} failed (${r.status})`);
        return res.status(502).json({ error: 'Voice search is busy right now. Try again, or type the word.' });
      }
      const data: any = await r.json();
      workingTranscribeModel = model;
      const text = String(data.text || '').trim().replace(/[.!?]+$/, '');
      return res.json({ text, model });
    } catch (err) {
      console.warn(`Transcription with ${model} errored:`, err);
    }
  }
  res.status(502).json({ error: 'Voice search is unavailable right now. Try again, or type the word.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SayNest server running at http://0.0.0.0:${port}`);
  });
}

startServer();
