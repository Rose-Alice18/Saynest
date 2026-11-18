import React, { useState, useEffect } from 'react';
import { WordEntry, AccentType } from '../types';
import { Volume2, Mic, MicOff, RotateCcw, X, Headphones, Gauge } from 'lucide-react';
import { speakWord } from '../utils/speech';
import {
  SpokenCheck,
  checkSpoken,
  transcriptsFromEvent,
  isSpeechRecognitionSupported,
  recognitionErrorMessage,
  UNSUPPORTED_MESSAGE,
} from '../utils/speechCheck';
import { SpokenCheckResult } from './SpokenCheckResult';

interface PronunciationModalProps {
  word: WordEntry;
  onClose: () => void;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({ word, onClose }) => {
  const [selectedAccent, setSelectedAccent] = useState<AccentType>('British');
  const [isRecording, setIsRecording] = useState(false);
  const [check, setCheck] = useState<SpokenCheck | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [activePlayback, setActivePlayback] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);

  // Play audio at customized speed
  const handleListen = (speedOverride?: number) => {
    const rate = speedOverride !== undefined ? speedOverride : audioSpeed;
    setActivePlayback(true);
    speakWord(
      word.word,
      selectedAccent,
      rate,
      undefined,
      () => setActivePlayback(true),
      () => setActivePlayback(false)
    );
  };

  const startVoiceRecording = () => {
    setCheck(null);
    setMicError(null);

    if (!isSpeechRecognitionSupported()) {
      setMicError(UNSUPPORTED_MESSAGE);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = selectedAccent === 'British' ? 'en-GB' : selectedAccent === 'American' ? 'en-US' : 'en-AU';
      recognition.interimResults = false;
      // Several guesses, so a correctly said word isn't marked wrong just
      // because the recogniser's first guess was a similar-sounding word
      recognition.maxAlternatives = 5;

      // Browsers sometimes stop listening with neither a result nor an error
      let settled = false;

      recognition.onstart = () => setIsRecording(true);

      recognition.onresult = (event: any) => {
        settled = true;
        setCheck(checkSpoken(word.word, transcriptsFromEvent(event)));
      };

      recognition.onerror = (event: any) => {
        settled = true;
        setIsRecording(false);
        setMicError(recognitionErrorMessage(event.error));
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (!settled) setMicError(recognitionErrorMessage('no-speech'));
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setMicError('Could not start the microphone. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-stone-800" />
            <h3 className="font-bold text-stone-900 text-lg">Practise pronunciation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-center">
          {/* Word Focus */}
          <div className="bg-[#FAF6EC] p-6 rounded-2xl border border-stone-200/80">
            <div className="text-3xl font-bold font-serif-display text-stone-900 tracking-tight">
              {word.word}
            </div>
            <div className="font-mono text-base text-stone-600 mt-1">
              {word.phonetic || word.accents[0]?.ipa}
            </div>
            {word.syllables && (
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-700 mt-2 bg-amber-100/70 inline-block px-2.5 py-1 rounded-md">
                Syllables: {word.syllables}
              </div>
            )}

            {/* Accent selection */}
            <div className="flex justify-center gap-2 mt-4">
              {(['British', 'American', 'Australian'] as AccentType[]).map((acc) => (
                <button
                  key={acc}
                  onClick={() => setSelectedAccent(acc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedAccent === acc
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* Continuous Audio Speed Slider & Listen Controls */}
          <div className="bg-[#FAF6EC] p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-700">
              <span className="flex items-center gap-1 font-semibold">
                <Gauge className="w-3.5 h-3.5 text-stone-500" />
                <span>Audio Playback Speed</span>
              </span>
              <span className="font-mono font-bold text-amber-800">
                {audioSpeed <= 0.75 ? 'Slow' : audioSpeed >= 1.25 ? 'Fast' : 'Normal'} ({audioSpeed.toFixed(2)}x)
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={audioSpeed}
              onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
            />

            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[
                { label: '0.6x', speed: 0.6 },
                { label: '0.8x Slow', speed: 0.8 },
                { label: '1.0x Normal', speed: 1.0 },
                { label: '1.25x Fast', speed: 1.25 }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAudioSpeed(preset.speed)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    Math.abs(audioSpeed - preset.speed) < 0.03
                      ? 'bg-amber-200 text-amber-950 font-bold'
                      : 'text-stone-500 hover:text-stone-800 bg-white/80'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                onClick={() => handleListen()}
                className="flex-1 py-2.5 px-4 bg-[#FFE042] hover:bg-[#F7D836] rounded-xl text-stone-900 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen ({audioSpeed.toFixed(2)}x)</span>
              </button>
            </div>
          </div>

          {/* Record Section */}
          <div className="pt-2 border-t border-stone-200">
            <div className="text-xs font-medium text-stone-500 mb-4">
              Now record yourself saying <span className="font-bold text-stone-800 font-serif">"{word.word}"</span>:
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={startVoiceRecording}
                disabled={isRecording}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg scale-105'
                    : 'bg-[#FFE042] text-stone-900 hover:scale-105 shadow-md hover:bg-[#F7D836]'
                }`}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                <span className="text-[10px] font-bold mt-1">
                  {isRecording ? 'Listening...' : 'Tap to speak'}
                </span>
              </button>

              {isRecording && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Speaking now...
                </div>
              )}
            </div>

            {/* What was heard, or why listening failed */}
            {!isRecording && (check || micError) && (
              <div className="mt-5">
                <SpokenCheckResult target={word.word} check={check} error={micError} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF6EC] border-t border-stone-200/70 flex items-center justify-between">
          <button
            onClick={() => {
              setCheck(null);
              setMicError(null);
            }}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
