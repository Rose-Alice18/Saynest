import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// .env.local (your private keys) takes priority over .env
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini client if key is available
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
  }
}

// Fetch authentic audio from Free Dictionary API if available with timeout
async function fetchDictionaryAudio(word: string): Promise<{
  ukAudio?: string;
  usAudio?: string;
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
    let ukAudio: string | undefined;
    let usAudio: string | undefined;
    
    if (Array.isArray(entry.phonetics)) {
      for (const p of entry.phonetics) {
        if (!p.audio) continue;
        if (p.audio.includes('-uk') || p.audio.includes('uk.') || p.audio.includes('/uk/')) {
          if (!ukAudio) ukAudio = p.audio;
        } else if (p.audio.includes('-us') || p.audio.includes('us.') || p.audio.includes('/us/')) {
          if (!usAudio) usAudio = p.audio;
        } else if (!usAudio) {
          usAudio = p.audio;
        }
      }
    }
    
    return {
      ukAudio,
      usAudio,
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

  // If Gemini is available, use it for deep nuanced linguistics
  if (aiClient) {
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

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        // Attach audio files if found
        if (parsed.accents) {
          for (const acc of parsed.accents) {
            if (acc.accent === 'British' && dictData.ukAudio) {
              acc.audioUrl = dictData.ukAudio;
            } else if (acc.accent === 'American' && dictData.usAudio) {
              acc.audioUrl = dictData.usAudio;
            }
          }
        }
        return res.json(parsed);
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
      relatedExpressions: []
    });
  }

  // Minimal algorithmic fallback
  return res.json({
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

  if (aiClient) {
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

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        return res.json(JSON.parse(response.text));
      }
    } catch (err) {
      console.warn('Scan text AI error:', err);
    }
  }

  // Fallback extraction
  const tokens = text
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 6)
    .slice(0, 5);

  const unique = Array.from(new Set(tokens));
  return res.json({
    extractedWords: unique.map(w => ({
      word: w.toLowerCase(),
      partOfSpeech: 'vocabulary',
      briefMeaning: `Important word identified in text passage.`,
      contextSentence: text.slice(0, 100) + '...',
      cefr: 'B2'
    }))
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
