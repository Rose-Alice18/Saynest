import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Volume2, Sparkles, Loader2, ArrowRight, RotateCcw, Search } from 'lucide-react';
import { speakWord } from '../utils/speech';

interface VoiceSearchModalProps {
  onClose: () => void;
  onSearch: (word: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  onClose,
  onSearch
}) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef<any>(null);

  const sampleWords = ['mimic', 'acquiesce', 'notwithstanding', 'by the same token', 'ostensibly', 'ephemeral'];

  const startListening = () => {
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
      recognition.maxAlternatives = 3;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorStatus(null);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interimChunk += item[0].transcript;
          }
        }

        const heardText = (finalChunk || interimChunk).trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
        if (heardText) {
          setTranscript(heardText);
        }

        if (finalChunk && heardText) {
          setIsListening(false);
          setTimeout(() => {
            onSearch(heardText);
            onClose();
          }, 450);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorStatus('Microphone permission not granted. You can type or tap a word below:');
        } else if (event.error === 'no-speech') {
          setErrorStatus('No voice picked up. Tap "Listen Again" or type your word:');
        } else {
          setErrorStatus(`Voice capture: ${event.error}. Tap to retry or type below:`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
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
            {isListening ? 'Listening now...' : transcript ? `"${transcript}"` : 'Say a word or phrase'}
          </h3>

          <p className="text-xs text-stone-600 mt-1 max-w-xs">
            {isListening 
              ? 'Speak clearly into your mic — automatically looks up upon pausing'
              : 'Tap microphone above to speak again, or type below'}
          </p>

          {!isListening && (
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

        {/* Live transcript banner */}
        {transcript && (
          <div className="p-3 bg-white rounded-2xl border border-stone-200 text-sm font-bold text-stone-900 flex items-center justify-between shadow-2xs">
            <span className="truncate">"{transcript}"</span>
            <button
              onClick={() => {
                onSearch(transcript);
                onClose();
              }}
              className="py-1 px-3 bg-[#FFE042] hover:bg-[#F7D836] rounded-xl text-xs font-bold text-stone-900 flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
