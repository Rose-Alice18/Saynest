import React from 'react';
import { Mic, Square } from 'lucide-react';

interface DictateButtonProps {
  listening: boolean;
  onToggle: () => void;
}

/** Mic button that sits under a text box: tap to speak, tap again to stop */
export const DictateButton: React.FC<DictateButtonProps> = ({ listening, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={listening}
    aria-label={listening ? 'Stop listening' : 'Speak instead of typing'}
    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
      listening
        ? 'bg-rose-50 border-rose-300 text-rose-800'
        : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
    }`}
  >
    {listening ? (
      <>
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-600" />
        </span>
        <Square className="w-3 h-3 fill-rose-700 text-rose-700" />
        <span>Stop</span>
      </>
    ) : (
      <>
        <Mic className="w-3.5 h-3.5" />
        <span>Speak it</span>
      </>
    )}
  </button>
);

/** What's being heard right now, plus any mic error */
export const DictationStatus: React.FC<{ listening: boolean; interim: string; error: string | null }> = ({
  listening,
  interim,
  error
}) => {
  if (error) {
    return (
      <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
        {error}
      </div>
    );
  }
  if (!listening) return null;
  return (
    <div aria-live="polite" className="text-xs text-stone-600 italic">
      {interim ? `Hearing: “${interim}”` : 'Listening… speak now. Add punctuation afterwards if you need it.'}
    </div>
  );
};
