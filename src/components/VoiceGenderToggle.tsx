import React, { useEffect, useState } from 'react';
import { AccentType } from '../types';
import { getVoiceGender, setVoiceGender, voicesForAccent, VoiceGender } from '../utils/speech';

interface VoiceGenderToggleProps {
  accent?: AccentType;
  /** Called after switching, e.g. to replay the word in the new voice */
  onChange?: (gender: VoiceGender) => void;
  className?: string;
}

/** "Voice: Male | Female". Remembered on this device and used everywhere SayNest speaks */
export const VoiceGenderToggle: React.FC<VoiceGenderToggleProps> = ({ accent = 'British', onChange, className = '' }) => {
  const [gender, setGender] = useState<VoiceGender>(getVoiceGender);
  const [available, setAvailable] = useState<{ male: boolean; female: boolean } | null>(null);

  useEffect(() => {
    const sync = (e: Event) => setGender((e as CustomEvent<VoiceGender>).detail);
    window.addEventListener('saynest-voice-gender', sync);
    return () => window.removeEventListener('saynest-voice-gender', sync);
  }, []);

  useEffect(() => {
    let alive = true;
    voicesForAccent(accent).then((a) => alive && setAvailable(a));
    return () => { alive = false; };
  }, [accent]);

  const choose = (g: VoiceGender) => {
    setVoiceGender(g);
    setGender(g);
    onChange?.(g);
  };
  const missing = available && !available[gender];

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div role="radiogroup" aria-label="Voice" className="inline-flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-lg text-[11px] font-semibold">
        <span className="px-1.5 text-stone-500">Voice</span>
        {(['male', 'female'] as VoiceGender[]).map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={gender === g}
            onClick={() => choose(g)}
            className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
              gender === g ? 'bg-white text-stone-950 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      {missing && (
        <span className="text-[10px] text-stone-500 leading-snug max-w-56">
          No {gender} {accent} voice on this device. On iPhone: Settings → Accessibility → Spoken Content → Voices → English to add one.
        </span>
      )}
    </div>
  );
};
