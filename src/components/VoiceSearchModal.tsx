import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Volume2, Sparkles, Loader2, ArrowRight, RotateCcw, Search } from 'lucide-react';
import { speakWord } from '../utils/speech';
import { isAccurateVoiceAvailable, startRecording, Recording, VoiceError } from '../utils/accurateVoice';

interface VoiceSearchModalProps {
  onClose: () => void;
  onSearch: (word: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  onClose,
  onSearch
}) => {
  const [transcript, setTranscript] = useState('');
  // The recogniser's other guesses, so a misheard word can be corrected with one tap
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef<any>(null);
  // Accurate mode: record, then the server transcribes with OpenAI
  const recordingRef = useRef<Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Some browsers keep "listening" forever without reporting anything. Stop
  // after this long without hearing words and tell the user.
  const LISTEN_TIMEOUT_MS = 8000;

  const clearWatchdog = () => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  };

  const cleanHeard = (text: string) => text.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '').trim();

  const sampleWords = ['mimic', 'acquiesce', 'notwithstanding', 'by the same token', 'ostensibly', 'ephemeral'];

  const startListening = async () => {
    if (typeof window === 'undefined') return;
    recordingRef.current?.cancel();
    if (await isAccurateVoiceAvailable()) {
      setErrorStatus(null);
      setTranscript('');
      setAlternatives([]);
      try {
        const rec = await startRecording({ onTranscribing: () => setIsTranscribing(true) });
        recordingRef.current = rec;
        setIsRecording(true);
        setIsListening(true);
        const text = await rec.result.finally(() => {
          setIsRecording(false);
          setIsListening(false);
          setIsTranscribing(false);
        });
        if (recordingRef.current !== rec) return; // a newer recording took over
        const heard = cleanHeard(text);
        if (heard) {
          setTranscript(heard);
          setManualInput(heard);
        } else {
          setErrorStatus("We couldn't make out any words. Tap Listen Again, or type below.");
        }
        return;
      } catch (err) {
        setIsRecording(false);
        setIsListening(false);
        setIsTranscribing(false);
        if (err instanceof VoiceError && err.kind !== 'server') {
          setErrorStatus(err.message);
          return;
        }
        // The transcription service failed: use the phone's own recognition instead
      }
    }
    startBrowserRecognition();
  };

  const startBrowserRecognition = () => {
    if (typeof window === 'undefined') return;

    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setIsListening(false);
      setErrorStatus('Browser speech recognition not available. You can type below or pick a word:');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;
      recognition.lang = navigator.language || 'en-US';

      let heardAnything = false;
      let failed = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorStatus(null);
        setTranscript('');
        setAlternatives([]);
        clearWatchdog();
        watchdogRef.current = setTimeout(() => {
          if (!heardAnything) {
            failed = true;
            try { recognition.abort(); } catch {}
            setIsListening(false);
            setErrorStatus(
              "We didn't catch that. Check your microphone is on, speak a little closer, or type below. " +
              'If this keeps happening, try Chrome.'
            );
          }
        }, LISTEN_TIMEOUT_MS);
      };

      recognition.onresult = (event: any) => {
        heardAnything = true;
        clearWatchdog();
        let finalResult: any = null;
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) finalResult = item;
          else interimText += item[0].transcript;
        }

        if (finalResult) {
          // Keep every distinct guess, best first, so the user can pick the
          // right one instead of us searching for a mishearing
          const guesses = Array.from({ length: finalResult.length }, (_, j) => cleanHeard(finalResult[j]?.transcript ?? ''))
            .filter(Boolean)
            .filter((g, idx, all) => all.findIndex((x) => x.toLowerCase() === g.toLowerCase()) === idx);
          if (guesses.length) {
            setTranscript(guesses[0]);
            setManualInput(guesses[0]);
            setAlternatives(guesses.slice(1));
          }
          setIsListening(false);
        } else if (cleanHeard(interimText)) {
          setTranscript(cleanHeard(interimText));
        }
      };

      recognition.onerror = (event: any) => {
        clearWatchdog();
        if (failed) return; // our own timeout already explained it
        failed = true;
        console.warn('Speech recognition status:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorStatus(
            'Microphone access is blocked. Click the microphone or padlock icon in the address bar, allow it, then tap Listen Again.'
          );
        } else if (event.error === 'no-speech') {
          setErrorStatus("We didn't hear anything. Tap Listen Again and speak clearly, or type below.");
        } else if (event.error === 'network') {
          setErrorStatus('Voice search needs an internet connection. Check your connection, or type below.');
        } else if (event.error !== 'aborted') {
          setErrorStatus(`Voice search had a problem (${event.error}). Tap Listen Again or type below.`);
        }
      };

      recognition.onend = () => {
        clearWatchdog();
        setIsListening(false);
        if (!heardAnything && !failed) {
          setErrorStatus("We didn't hear anything. Tap Listen Again and speak clearly, or type below.");
        }
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setErrorStatus('Could not access microphone directly. Type below or choose a word:');
    }
  };

  useEffect(() => {
    startListening();

    return () => {
      recordingRef.current?.cancel();
      clearWatchdog();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleTestWord = (w: string) => {
    speakWord(w, 'British', 1.0);
    onSearch(w);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onSearch(manualInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div 
        className="w-full max-w-sm bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Voice & Instant Search</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pulsing Mic Circle */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-[#FFE042] animate-ping opacity-30"></div>
                <div className="absolute w-24 h-24 rounded-full bg-[#FFE042] opacity-50"></div>
              </>
            )}
            <button
              type="button"
              onClick={startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-[#FFE042] scale-105 shadow-md text-stone-950' 
                  : 'bg-stone-100 hover:bg-[#FFE042] text-stone-700'
              }`}
              title="Click to restart listening"
            >
              <Mic className={`w-8 h-8 ${isListening ? 'text-stone-950 animate-pulse' : 'text-stone-600'}`} />
            </button>
          </div>

          <h3 className="text-lg font-bold font-serif-display text-stone-950 mt-4">
            {isTranscribing
              ? 'Working out what you said…'
              : isListening
                ? transcript ? `"${transcript}"` : 'Listening now...'
                : transcript ? 'Is this right?' : 'Say a word or phrase'}
          </h3>

          <p className="text-xs text-stone-600 mt-1 max-w-xs">
            {isTranscribing
              ? 'One moment'
              : isRecording
                ? 'Say it, then pause, or tap Done'
                : isListening
                  ? 'Speak clearly, then pause'
              : transcript
                ? 'Tap what you said, fix it in the box below, or try again'
                : 'Tap the microphone to speak, or type below'}
          </p>

          {isRecording && !isTranscribing && (
            <button
              type="button"
              onClick={() => recordingRef.current?.stop()}
              className="mt-3 py-2 px-5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          )}
          {isTranscribing && <Loader2 className="mt-3 w-5 h-5 animate-spin text-stone-700" />}
          {!isListening && !isTranscribing && (
            <button
              type="button"
              onClick={startListening}
              className="mt-3 py-1.5 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Listen Again</span>
            </button>
          )}
        </div>

        {/* What we heard: confirm before searching, since speech
            recognition often mishears. Other guesses are one tap away. */}
        {transcript && !isListening && (
          <div className="space-y-2 text-left">
            <button
              type="button"
              autoFocus
              onClick={() => {
                onSearch(transcript);
                onClose();
              }}
              className="w-full p-3 bg-white hover:bg-[#FFFBEA] rounded-2xl border-2 border-[#FFE042] text-sm font-bold text-stone-900 flex items-center justify-between shadow-2xs transition-colors"
            >
              <span className="truncate">"{transcript}"</span>
              <span className="py-1 px-3 bg-[#FFE042] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 ml-2">
                Search <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {alternatives.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  Or did you say:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {alternatives.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => {
                        onSearch(alt);
                        onClose();
                      }}
                      className="py-1.5 px-3 bg-white hover:bg-[#FFE042] border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 transition-colors"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {errorStatus && (
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 text-left">
            {errorStatus}
          </div>
        )}

        {/* Direct Manual Fallback Input */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-stone-200/80">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-stone-400" />
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type word directly..."
              className="w-full pl-8 pr-16 py-2 bg-white rounded-xl border border-stone-200 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="absolute right-1.5 py-1 px-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Sample Word Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider text-left">
            Or tap to lookup & hear:
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {sampleWords.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleTestWord(w)}
                className="py-1 px-2.5 bg-[#FAF6EC] hover:bg-[#FFE042] text-stone-900 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
              >
                <Volume2 className="w-3 h-3 text-stone-500" />
                <span>{w}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
