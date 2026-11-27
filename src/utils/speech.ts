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

// ---------------------------------------------------------------------------
// Male or female voice
//
// Browsers don't say which voices are male or female, so we go by the names
// that iPhone, Mac, Android (Google), Windows (Microsoft) and Chrome use.
export type VoiceGender = 'male' | 'female';
const GENDER_KEY = 'saynest_voice_gender';

const FEMALE = /\b(female|woman|serena|kate|stephanie|martha|fiona|moira|tessa|hazel|libby|sonia|maisie|mia|bella|abbi|hollie|olivia|samantha|allison|ava|susan|victoria|zoe|nicky|jenny|aria|zira|michelle|ana|emma|joanna|salli|kimberly|ivy|karen|catherine|natasha|hayley|freya|elsie|annette|carly|kylie|tina|joanne|amy|lucy|ruth)\b/i;
const MALE = /\b(male|man|daniel|arthur|oliver|george|ryan|thomas|alfie|elliot|ethan|noah|brian|alex|tom|fred|aaron|evan|nathan|guy|david|mark|christopher|eric|roger|steffan|andrew|davis|tony|jason|lee|gordon|william|darren|duncan|ken|neil|tim|james|rishi|reed|eddy|grandpa|rocko)\b/i;

export function getVoiceGender(): VoiceGender {
  try {
    return localStorage.getItem(GENDER_KEY) === 'female' ? 'female' : 'male';
  } catch {
    return 'male';
  }
}

export function setVoiceGender(gender: VoiceGender) {
  try {
    localStorage.setItem(GENDER_KEY, gender);
  } catch {}
  window.dispatchEvent(new CustomEvent('saynest-voice-gender', { detail: gender }));
}

const genderOf = (v: SpeechSynthesisVoice): VoiceGender | null =>
  FEMALE.test(v.name) ? 'female' : MALE.test(v.name) ? 'male' : null;

/** Voices for an accent, with whether a male and a female one are available */
export async function voicesForAccent(accent: AccentType) {
  const voices = await getAvailableVoices();
  const lang = accent === 'British' ? 'en-gb' : accent === 'American' ? 'en-us' : 'en-au';
  const forLang = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
  return {
    female: forLang.some((v) => genderOf(v) === 'female'),
    male: forLang.some((v) => genderOf(v) === 'male')
  };
}

function findBestVoice(voices: SpeechSynthesisVoice[], accent: AccentType, gender: VoiceGender = getVoiceGender()): SpeechSynthesisVoice | null {
  const targetLang = (accent === 'British' ? 'en-GB' : accent === 'American' ? 'en-US' : 'en-AU').toLowerCase();
  const forLang = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang));

  // Best first: the right gender, then natural-sounding / enhanced voices
  const quality = (v: SpeechSynthesisVoice) =>
    (/premium|enhanced|natural|neural|online/i.test(v.name) ? 3 : 0) +
    (/google|siri/i.test(v.name) ? 1 : 0) +
    (v.localService === false ? 0.5 : 0);
  const score = (v: SpeechSynthesisVoice) => (genderOf(v) === gender ? 10 : genderOf(v) === null ? 2 : 0) + quality(v);
  const best = [...forLang].sort((a, b) => score(b) - score(a))[0];
  if (best) return best;

  // No voice for this accent at all: any English voice of the right gender, then any English
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return english.find((v) => genderOf(v) === gender) || english[0] || voices[0] || null;
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
