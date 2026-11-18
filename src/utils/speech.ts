import { AccentType } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
let activeCommuteToken = 0;

export function stopAllAudio() {
  activeCommuteToken++;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  currentUtterance = null;
}

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    // Fallback if event doesn't fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

function findBestVoice(voices: SpeechSynthesisVoice[], accent: AccentType): SpeechSynthesisVoice | null {
  const targetLang = accent === 'British' ? 'en-GB' : accent === 'American' ? 'en-US' : 'en-AU';
  
  // Try exact match with high quality names
  const preferred = voices.find(v => {
    const isLang = v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase());
    const isNatural = /natural|google|daniel|serena|oliver|samantha|karen/i.test(v.name);
    return isLang && isNatural;
  });

  if (preferred) return preferred;

  // Fallback to any voice with that language prefix
  const langMatch = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase()));
  if (langMatch) return langMatch;

  // Fallback to any English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

export async function speakWord(
  text: string,
  accent: AccentType = 'British',
  rate: number = 1.0,
  audioFallbackUrl?: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopAllAudio();

  // Prefer an authentic dictionary recording when we have one for this accent
  if (audioFallbackUrl && audioFallbackUrl.startsWith('http')) {
    const audio = new Audio(audioFallbackUrl);
    currentAudioElement = audio;
    audio.playbackRate = rate;

    // A broken link triggers both the 'error' event and a rejected play()
    // promise. Fall back to the synthesised voice only once, otherwise the
    // word is spoken twice.
    let fellBack = false;
    const fallBack = () => {
      if (fellBack || currentAudioElement !== audio) return;
      fellBack = true;
      currentAudioElement = null;
      speakWithSynthesis(text, accent, rate, onStart, onEnd);
    };

    if (onStart) audio.onplay = () => onStart();
    audio.onended = () => {
      currentAudioElement = null;
      if (onEnd) onEnd();
    };
    audio.onerror = fallBack;
    try {
      await audio.play();
    } catch {
      fallBack();
    }
    return;
  }

  speakWithSynthesis(text, accent, rate, onStart, onEnd);
}

async function speakWithSynthesis(
  text: string,
  accent: AccentType,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  const voices = await getAvailableVoices();
  const voice = findBestVoice(voices, accent);

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = accent === 'British' ? 'en-GB' : accent === 'American' ? 'en-US' : 'en-AU';
  }

  utterance.rate = rate;
  utterance.pitch = 1.0;

  if (onStart) {
    utterance.onstart = () => onStart();
  }
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {}

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  
  // Ensure not paused on Chrome
  try {
    window.speechSynthesis.resume();
  } catch {}
}

// Hands-free Commute sequence: reads word, pauses briefly, reads meaning, pauses briefly, reads example
export async function playCommuteSequence(
  word: string,
  meaning: string,
  example?: string,
  accent: AccentType = 'British',
  rate: number = 0.95,
  onStatusChange?: (status: 'word' | 'meaning' | 'example' | 'done') => void
): Promise<boolean> {
  // Cancel any prior sequence and create a new unique token for this playback
  stopAllAudio();
  const token = activeCommuteToken;

  const waitWithCheck = (ms: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const step = 50;
      let elapsed = 0;
      const interval = setInterval(() => {
        if (token !== activeCommuteToken) {
          clearInterval(interval);
          resolve(false);
          return;
        }
        elapsed += step;
        if (elapsed >= ms) {
          clearInterval(interval);
          resolve(true);
        }
      }, step);
    });
  };

  const speakSegment = (text: string, status: 'word' | 'meaning' | 'example'): Promise<boolean> => {
    return new Promise((resolve) => {
      if (token !== activeCommuteToken) {
        resolve(false);
        return;
      }
      if (onStatusChange) onStatusChange(status);
      speakWithSynthesis(text, accent, rate, undefined, () => {
        if (token !== activeCommuteToken) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  // 1. Speak Word
  const wordOk = await speakSegment(word, 'word');
  if (!wordOk || token !== activeCommuteToken) return false;

  const pause1 = await waitWithCheck(700);
  if (!pause1 || token !== activeCommuteToken) return false;

  // 2. Speak Meaning
  if (meaning) {
    const meaningOk = await speakSegment(`Meaning: ${meaning}`, 'meaning');
    if (!meaningOk || token !== activeCommuteToken) return false;

    const pause2 = await waitWithCheck(700);
    if (!pause2 || token !== activeCommuteToken) return false;
  }

  // 3. Speak Example
  if (example) {
    const exampleOk = await speakSegment(`Example: ${example}`, 'example');
    if (!exampleOk || token !== activeCommuteToken) return false;

    const pause3 = await waitWithCheck(500);
    if (!pause3 || token !== activeCommuteToken) return false;
  }

  if (token === activeCommuteToken) {
    if (onStatusChange) onStatusChange('done');
    return true;
  }
  return false;
}
