import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// .env.local (your private keys) takes priority over .env
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const app = express();
const port = Number(process.env.PORT) || 3000;

// Page photos are sent as base64 JSON, so that one route allows a larger body.
// Everything else keeps Express's small default.
const smallJson = express.json();
const photoJson = express.json({ limit: '8mb' });
app.use((req, res, next) => (req.path === '/api/scan-image' ? photoJson : smallJson)(req, res, next));

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

  // If an AI provider is configured, use it for deep nuanced linguistics
  if (!quick && aiProviders.length > 0) {
    try {
      const prompt = `You are the master lexicographer behind the SayNest pronunciation and vocabulary app.
Provide a rich, precise JSON analysis for the word or phrase: "${word}".
Return ONLY valid JSON with this exact schema:
{
  "word": "${word}",
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

// Book search & cover fetch endpoint
app.get('/api/books/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // 1. Try OpenLibrary Search
    const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`, {
      signal: AbortSignal.timeout(4000)
    });

    if (olRes.ok) {
      const olData = await olRes.json();
      if (olData.docs && olData.docs.length > 0) {
        const books = olData.docs
          .map((doc: any) => {
            const author = Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || 'Unknown Author');
            const coverUrl = doc.cover_i 
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` 
              : (doc.isbn && doc.isbn[0] ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg` : undefined);
            
            return {
              id: doc.key ? doc.key.replace('/works/', '') : `book-${Date.now()}-${Math.random()}`,
              title: doc.title,
              author,
              coverUrl,
              year: doc.first_publish_year,
              pageCount: doc.number_of_pages_median || 300
            };
          });

        return res.json({ books });
      }
    }
  } catch (olErr) {
    console.warn('OpenLibrary search error, trying Google Books fallback:', olErr);
  }

  // 2. Google Books fallback
  try {
    const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6`, {
      signal: AbortSignal.timeout(4000)
    });
    if (gbRes.ok) {
      const gbData = await gbRes.json();
      if (gbData.items && gbData.items.length > 0) {
        const books = gbData.items.map((item: any) => {
          const info = item.volumeInfo || {};
          let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
          if (coverUrl && coverUrl.startsWith('http://')) {
            coverUrl = coverUrl.replace('http://', 'https://');
          }
          return {
            id: item.id || `book-${Date.now()}`,
            title: info.title || query,
            author: (info.authors && info.authors[0]) || 'Unknown Author',
            coverUrl,
            year: info.publishedDate ? info.publishedDate.slice(0, 4) : undefined,
            pageCount: info.pageCount || 250
          };
        });
        return res.json({ books });
      }
    }
  } catch (gbErr) {
    console.warn('Google Books fallback error:', gbErr);
  }

  // Fallback book entry
  return res.json({
    books: [
      {
        id: `book-${Date.now()}`,
        title: query,
        author: 'Author',
        coverUrl: undefined,
        pageCount: 200
      }
    ]
  });
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
