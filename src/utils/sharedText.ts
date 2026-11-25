// Text sent to SayNest from another app: an iPhone Shortcut opens
// saynest.me/?share=..., and Android's share menu opens /?text=...&title=...
//
// Apple Books adds a citation to anything you share, e.g.
//
//   “determination”
//
//   Excerpt From
//   From Third World to First The Singapore Story: 1965–2000
//   Lee Kuan Yew
//   This material may be protected by copyright.
//
// so the book and author are taken from that and the rest is removed.
import { looksLikeWordList } from './wordList';

export interface SharedText {
  text: string;
  book?: string;
  author?: string;
  /** A word or short phrase is looked up; anything longer is scanned for words */
  kind: 'lookup' | 'passage' | 'list';
}

const QUOTES = /^[\s"'“”‘’«»]+|[\s"'“”‘’«»]+$/g;

export function parseSharedText(raw: string): SharedText | null {
  if (!raw) return null;
  let text = raw.replace(/\r\n/g, '\n').trim();
  let book: string | undefined;
  let author: string | undefined;

  // Apple Books citation
  const citation = text.match(/\n\s*Excerpt From\s*\n([\s\S]*)$/i);
  if (citation) {
    text = text.slice(0, citation.index).trim();
    const lines = citation[1]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/may be protected by copyright/i.test(l) && !/^https?:\/\//i.test(l));
    book = lines[0];
    author = lines[1];
  }

  // A link on its own line (some apps add one) isn't part of the text
  text = text.replace(/\n\s*https?:\/\/\S+\s*$/i, '').trim();
  // A list of words (one per line), e.g. a note of vocabulary: keep its lines
  if (looksLikeWordList(text)) return { text, book, author, kind: 'list' };
  text = text.replace(QUOTES, '').replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const words = text.split(' ').filter(Boolean);
  const kind: SharedText['kind'] = words.length <= 4 && text.length <= 60 ? 'lookup' : 'passage';
  // A single shared word often carries the full stop or comma after it
  if (kind === 'lookup') text = text.replace(/[.,;:!?)\]]+$/, '').replace(/^[(\[]+/, '').trim();
  return { text, book, author, kind };
}

/** Read and remove ?share= / ?text= from the address, so a refresh doesn't repeat it */
export function takeSharedTextFromUrl(): SharedText | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('share') || [params.get('text'), params.get('url')].filter(Boolean).join('\n') || params.get('title') || '';
  if (!params.has('share') && !params.has('text') && !params.has('url') && !params.has('title')) return null;
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
  return parseSharedText(raw);
}
