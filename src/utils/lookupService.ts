import { WordEntry, AccentInfo } from '../types';
import { INITIAL_WORDS } from '../data/initialData';

export async function lookupWord(query: string): Promise<WordEntry> {
  const cleanWord = query.trim().toLowerCase();

  // 1. Check if it matches our pre-seeded curated entries first
  const existingSeed = INITIAL_WORDS.find(
    w => w.word.toLowerCase() === cleanWord || w.word.toLowerCase().includes(cleanWord)
  );
  if (existingSeed) {
    return { ...existingSeed, id: `seed-${Date.now()}` };
  }

  // 2. Try server-side API lookup (/api/lookup)
  try {
    const res = await fetch(`/api/lookup?word=${encodeURIComponent(cleanWord)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.word) {
        return {
          id: `lookup-${Date.now()}`,
          word: data.word,
          type: data.type || 'word',
          phonetic: data.phonetic || `/${data.word}/`,
          syllables: data.syllables || data.word.toUpperCase(),
          accents: data.accents || [
            { accent: 'British', ipa: data.phonetic || `/${data.word}/`, flag: '🇬🇧', langCode: 'en-GB' },
            { accent: 'American', ipa: data.phonetic || `/${data.word}/`, flag: '🇺🇸', langCode: 'en-US' },
            { accent: 'Australian', ipa: data.phonetic || `/${data.word}/`, flag: '🇦🇺', langCode: 'en-AU' }
          ],
          meanings: data.meanings || [
            {
              partOfSpeech: 'word',
              definitions: [{ definition: `Definition for ${data.word}.` }]
            }
          ],
          nuance: data.nuance || {
            bestUsedWhen: [`Employed for precision when expressing "${data.word}".`],
            formality: 'Neutral',
            cefr: 'B2'
          },
          relatedExpressions: data.relatedExpressions || [],
          dateAdded: new Date().toISOString(),
          groupDate: 'Today',
          tags: ['discovered', data.word.toLowerCase()]
        };
      }
    }
  } catch (err) {
    console.warn('Server lookup failed, trying direct public dictionary fallback:', err);
  }

  // 3. Direct client fallback to Free Dictionary API
  try {
    const directRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (directRes.ok) {
      const dictData = await directRes.json();
      if (Array.isArray(dictData) && dictData.length > 0) {
        const item = dictData[0];
        
        let ukAudio: string | undefined;
        let usAudio: string | undefined;
        let primaryIpa = item.phonetic || '';

        if (Array.isArray(item.phonetics)) {
          for (const p of item.phonetics) {
            if (!primaryIpa && p.text) primaryIpa = p.text;
            if (p.audio) {
              if (p.audio.includes('-uk') || p.audio.includes('uk.') || p.audio.includes('/uk/')) {
                if (!ukAudio) ukAudio = p.audio;
              } else if (p.audio.includes('-us') || p.audio.includes('us.') || p.audio.includes('/us/')) {
                if (!usAudio) usAudio = p.audio;
              } else if (!usAudio) {
                usAudio = p.audio;
              }
            }
          }
        }

        const accents: AccentInfo[] = [
          {
            accent: 'British',
            ipa: primaryIpa || `/${cleanWord}/`,
            audioUrl: ukAudio,
            flag: '🇬🇧',
            langCode: 'en-GB'
          },
          {
            accent: 'American',
            ipa: primaryIpa || `/${cleanWord}/`,
            audioUrl: usAudio,
            flag: '🇺🇸',
            langCode: 'en-US'
          },
          {
            accent: 'Australian',
            ipa: primaryIpa || `/${cleanWord}/`,
            flag: '🇦🇺',
            langCode: 'en-AU'
          }
        ];

        const meanings = (item.meanings || []).map((m: any) => ({
          partOfSpeech: m.partOfSpeech || 'definition',
          definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({
            definition: d.definition,
            example: d.example || `The word "${cleanWord}" is employed here with deliberate precision.`
          }))
        }));

        return {
          id: `client-${Date.now()}`,
          word: item.word || cleanWord,
          type: 'word',
          phonetic: primaryIpa || `/${cleanWord}/`,
          syllables: cleanWord.toUpperCase(),
          accents,
          meanings,
          nuance: {
            bestUsedWhen: [`Employed for precision in spoken and written discourse.`],
            formality: 'Neutral',
            cefr: 'B2'
          },
          relatedExpressions: [],
          dateAdded: new Date().toISOString(),
          groupDate: 'Today',
          tags: ['discovered', cleanWord]
        };
      }
    }
  } catch (clientErr) {
    console.warn('Client dictionary API failed:', clientErr);
  }

  // 4. Guaranteed algorithmic fallback so user search NEVER hangs
  return {
    id: `fallback-${Date.now()}`,
    word: cleanWord,
    type: 'word',
    phonetic: `/${cleanWord}/`,
    syllables: cleanWord.toUpperCase(),
    accents: [
      { accent: 'British', ipa: `/${cleanWord}/`, flag: '🇬🇧', langCode: 'en-GB' },
      { accent: 'American', ipa: `/${cleanWord}/`, flag: '🇺🇸', langCode: 'en-US' },
      { accent: 'Australian', ipa: `/${cleanWord}/`, flag: '🇦🇺', langCode: 'en-AU' }
    ],
    meanings: [
      {
        partOfSpeech: 'concept',
        definitions: [
          {
            definition: `Expression or concept of "${cleanWord}".`,
            example: `She made a note of "${cleanWord}" in her personal lexicon.`
          }
        ]
      }
    ],
    nuance: {
      bestUsedWhen: ['Refining vocabulary and expanding personal discourse.'],
      formality: 'Neutral'
    },
    dateAdded: new Date().toISOString(),
    groupDate: 'Today',
    tags: ['discovered', cleanWord]
  };
}
