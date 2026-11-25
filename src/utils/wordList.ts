// Reading a list of words pasted or shared from somewhere like Apple Notes:
//
//   Words Meaning 📖📚
//   1. Capricious
//   4. Callous : showing or having an insensitive and cruel disregard for others.
//   - Delirious: in an acutely disturbed state of mind…
//
// Each line becomes a word, plus the meaning if one was written after it.

export interface ListedWord {
  word: string;
  /** The meaning written next to the word, if any */
  meaning?: string;
}

const MARKER = /^\s*(?:\d{1,4}\s*[.)\]:-]|[-–—•*▪◦·>]|\[[ xX]?\])\s*/; // "12.", "3)", "-", "•", "[ ]"
const SEPARATOR = /\s*(?:\s[:–—-]\s|:\s*|\s[–—]\s?|\s=\s)/; // " : ", ":", " - ", " – ", " = "
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

const cleanWord = (w: string) =>
  w
    .replace(EMOJI, '')
    .replace(/^[\s"'“”‘’(*_]+|[\s"'“”‘’)*_.,;!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Split one line into a word (up to 5 words long) and an optional meaning */
function parseLine(line: string): ListedWord | null {
  const body = line.replace(MARKER, '').trim();
  if (!body) return null;
  const sep = body.match(SEPARATOR);
  let wordPart = body;
  let meaning: string | undefined;
  if (sep && sep.index !== undefined && sep.index > 0) {
    wordPart = body.slice(0, sep.index);
    meaning = body.slice(sep.index + sep[0].length).trim() || undefined;
  }
  const word = cleanWord(wordPart);
  if (!word || !/[a-zA-Z]/.test(word)) return null;
  // Too long to be a word or phrase: it's probably a sentence, not a list item
  if (word.split(' ').length > 5 || word.length > 50) return null;
  return { word, meaning: meaning?.replace(/\s+/g, ' ') };
}

/** True when the text looks like a list of words rather than a passage of prose */
export function looksLikeWordList(text: string): boolean {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  const items = lines.filter((l) => parseLine(l));
  const marked = lines.filter((l) => MARKER.test(l));
  return items.length / lines.length >= 0.6 && (marked.length >= 2 || items.length / lines.length >= 0.85);
}

export function parseWordList(text: string): ListedWord[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const hasMarkers = lines.filter((l) => MARKER.test(l)).length >= 2;
  const out: ListedWord[] = [];
  const seen = new Set<string>();
  lines.forEach((line, i) => {
    // In a numbered/bulleted list, an unmarked first line is the title ("Words Meaning 📖📚")
    if (hasMarkers && i === 0 && !MARKER.test(line)) return;
    const item = parseLine(line);
    if (!item) return;
    const key = item.word.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    // Capitalised list entries ("Capricious") are saved in lower case, but
    // keep names and acronyms that are capitalised inside the word
    const word = /^[A-Z][a-z'’-]+( [a-z'’-]+)*$/.test(item.word) ? item.word.toLowerCase() : item.word;
    out.push({ word, meaning: item.meaning });
  });
  return out;
}
