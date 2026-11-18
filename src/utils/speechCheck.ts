// Honest checking for "say it out loud" practice.
//
// The browser's speech recognition tells us which words it understood, not
// how good someone's accent is. So instead of inventing a score, we report
// what was heard and whether it matches the target word or phrase.

export type SpokenVerdict = 'match' | 'partial' | 'different';

export interface SpokenCheck {
  verdict: SpokenVerdict;
  /** What the browser heard (the closest of its guesses) */
  heard: string;
  /** Words from the target that weren't heard (for phrases) */
  missedWords: string[];
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function checkOne(target: string, heard: string): SpokenCheck {
  const targetNorm = normalize(target);
  const heardNorm = normalize(heard);
  const targetWords = targetNorm.split(' ').filter(Boolean);
  const heardWords = new Set(heardNorm.split(' ').filter(Boolean));
  const missedWords = targetWords.filter((w) => !heardWords.has(w));

  // Saying the target inside a longer sentence still counts as a match
  if (heardNorm && ` ${heardNorm} `.includes(` ${targetNorm} `)) {
    return { verdict: 'match', heard, missedWords: [] };
  }
  // Recognisers often split compound words ("not withstanding" for
  // "notwithstanding"), so also compare with the spaces removed
  if (heardNorm && heardNorm.replace(/ /g, '').includes(targetNorm.replace(/ /g, ''))) {
    return { verdict: 'match', heard, missedWords: [] };
  }
  // For phrases, most of the words heard (in any order) is close
  const heardShare = targetWords.length ? (targetWords.length - missedWords.length) / targetWords.length : 0;
  if (targetWords.length > 1 && heardShare >= 0.5) {
    return { verdict: 'partial', heard, missedWords };
  }
  return { verdict: 'different', heard, missedWords };
}

/**
 * Compare what the browser heard with the target. Pass all of the
 * recogniser's alternatives; the closest one is used.
 */
export function checkSpoken(target: string, alternatives: string[]): SpokenCheck {
  const rank: Record<SpokenVerdict, number> = { match: 0, partial: 1, different: 2 };
  const results = alternatives.filter((a) => a.trim()).map((a) => checkOne(target, a.trim()));
  if (!results.length) return { verdict: 'different', heard: '', missedWords: normalize(target).split(' ') };
  return results.sort(
    (a, b) => rank[a.verdict] - rank[b.verdict] || a.missedWords.length - b.missedWords.length
  )[0];
}

/** All alternatives from a SpeechRecognition result event */
export function transcriptsFromEvent(event: any): string[] {
  const result = event?.results?.[0];
  if (!result) return [];
  return Array.from({ length: result.length }, (_, i) => result[i]?.transcript ?? '');
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export const UNSUPPORTED_MESSAGE =
  "Your browser can't listen for speech. Try Chrome or Edge on a laptop or Android phone.";

/** Turn a SpeechRecognition error code into something a learner can act on */
export function recognitionErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Click the microphone or padlock icon in the address bar, allow it, then try again.';
    case 'no-speech':
      return "We didn't hear anything. Tap the microphone and speak clearly.";
    case 'audio-capture':
      return 'No microphone was found. Check one is connected and not used by another app.';
    case 'network':
      return 'Speech checking needs an internet connection. Check your connection and try again.';
    case 'aborted':
      return 'Listening was stopped. Tap the microphone to try again.';
    default:
      return `Something went wrong while listening (${code}). Please try again.`;
  }
}
