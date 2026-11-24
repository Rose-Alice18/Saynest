// Speak-to-type for text boxes (quotes, pasted passages).
//
// Keeps listening until you tap the mic again, adding each finished
// sentence to the box. What's still being heard is shown as `interim`.
import { useEffect, useRef, useState } from 'react';
import { isSpeechRecognitionSupported, recognitionErrorMessage, UNSUPPORTED_MESSAGE } from './speechCheck';

/** Add spoken text to what's already typed, with a space and a capital where needed */
export function appendSpoken(existing: string, spoken: string): string {
  const text = spoken.trim();
  if (!text) return existing;
  const before = existing.replace(/\s+$/, '');
  const startsSentence = !before || /[.!?]$/.test(before);
  const piece = startsSentence ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  return before ? `${before} ${piece}` : piece;
}

export function useDictation(onText: (text: string) => void, lang = 'en-GB') {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const stop = () => recRef.current?.stop();

  const start = () => {
    setError(null);
    if (!isSpeechRecognitionSupported()) {
      setError(UNSUPPORTED_MESSAGE);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    // Each finished result is added once, even if the browser repeats it
    const done = new Set<number>();

    rec.onresult = (event: any) => {
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          if (!done.has(i)) {
            done.add(i);
            onTextRef.current(result[0].transcript);
          }
        } else {
          pending += result[0].transcript;
        }
      }
      setInterim(pending);
    };
    rec.onerror = (event: any) => {
      if (event.error !== 'aborted') setError(recognitionErrorMessage(event.error));
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
      recRef.current = null;
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('Could not start the microphone. Please try again.');
      recRef.current = null;
    }
  };

  // Stop listening if the box is closed mid-sentence
  useEffect(() => () => recRef.current?.abort(), []);

  return { listening, interim, error, start, stop, toggle: () => (listening ? stop() : start()) };
}
