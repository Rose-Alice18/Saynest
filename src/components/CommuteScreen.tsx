import React, { useState, useEffect, useRef } from 'react';
import { WordEntry } from '../types';
import { 
  ArrowLeft, Settings, SkipBack, Play, Pause, SkipForward, 
  Volume2, VolumeX, Gauge, ListMusic, Eye, EyeOff, Headphones
} from 'lucide-react';
import { playCommuteSequence, stopAllAudio } from '../utils/speech';
import { SayNestBird } from './SayNestBird';
import { VoiceGenderToggle } from './VoiceGenderToggle';

interface CommuteScreenProps {
  words: WordEntry[];
  onBack: () => void;
}

// Slow, normal and fast sit at the left end, middle and right end of the
// slider, so the buttons under it line up with the positions they stand for
const SPEED_PRESETS = [
  { label: '0.6× Slow', speed: 0.6 },
  { label: '1.0× Normal', speed: 1.0 },
  { label: '1.4× Fast', speed: 1.4 }
];

export const CommuteScreen: React.FC<CommuteScreenProps> = ({ words, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showText, setShowText] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'Meaning' | 'Example' | 'Your note'>('Meaning');
  const [readingStatus, setReadingStatus] = useState<'word' | 'meaning' | 'example' | 'done'>('done');

  const commutePlaylist = words.length > 0 ? words : [];
  const currentItem = commutePlaylist[currentIndex] || commutePlaylist[0];

  const isPlayingRef = useRef(false);
  const autoPlayNextRef = useRef(autoPlayNext);
  autoPlayNextRef.current = autoPlayNext;
  // Each run gets an id. When Next/Prev/speed restarts playback, the old run
  // finishes "interrupted" a moment later; without this check it would mark
  // the new run as paused while its audio kept playing.
  const runIdRef = useRef(0);

  const runSequence = async (index: number, speed: number = speechSpeed) => {
    const item = commutePlaylist[index];
    if (!item) return;

    const runId = ++runIdRef.current;
    isPlayingRef.current = true;
    setIsPlaying(true);
    const meaning = item.meanings[0]?.definitions[0]?.definition || '';
    const example = item.meanings[0]?.definitions[0]?.example || '';

    const finishedOk = await playCommuteSequence(
      item.word,
      meaning,
      example,
      'British',
      speed,
      (status) => {
        if (!isPlayingRef.current || runId !== runIdRef.current) return;
        setReadingStatus(status);
        if (status === 'meaning') setActiveBottomTab('Meaning');
        if (status === 'example') setActiveBottomTab('Example');
      }
    );

    // A newer run has taken over; leave the state to it
    if (runId !== runIdRef.current) return;

    // Only advance when playback completed naturally without user pausing
    if (finishedOk && isPlayingRef.current && autoPlayNextRef.current) {
      const nextIdx = (index + 1) % commutePlaylist.length;
      setCurrentIndex(nextIdx);
      runSequence(nextIdx, speed);
    } else if (!finishedOk || !isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setReadingStatus('done');
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      runIdRef.current++; // invalidate the current run
      isPlayingRef.current = false;
      stopAllAudio();
      setIsPlaying(false);
      setReadingStatus('done');
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      runSequence(currentIndex);
    }
  };

  const handleNext = () => {
    const wasPlaying = isPlaying;
    runIdRef.current++;
    isPlayingRef.current = false;
    stopAllAudio();
    const nextIdx = (currentIndex + 1) % commutePlaylist.length;
    setCurrentIndex(nextIdx);
    if (wasPlaying) {
      runSequence(nextIdx);
    } else {
      setIsPlaying(false);
      setReadingStatus('done');
    }
  };

  const handlePrev = () => {
    const wasPlaying = isPlaying;
    runIdRef.current++;
    isPlayingRef.current = false;
    stopAllAudio();
    const prevIdx = (currentIndex - 1 + commutePlaylist.length) % commutePlaylist.length;
    setCurrentIndex(prevIdx);
    if (wasPlaying) {
      runSequence(prevIdx);
    } else {
      setIsPlaying(false);
      setReadingStatus('done');
    }
  };

  // Change the pace and hear it straight away. While the slider is being
  // dragged, wait until it settles so the audio doesn't restart on every step.
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeSpeed = (next: number, { immediate = true } = {}) => {
    setSpeechSpeed(next);
    if (!isPlayingRef.current) return;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    const restart = () => {
      if (!isPlayingRef.current) return;
      stopAllAudio();
      // Pass the new speed directly; the state update hasn't applied yet
      runSequence(currentIndex, next);
    };
    if (immediate) restart();
    else restartTimer.current = setTimeout(restart, 350);
  };

  const cycleSpeed = () => {
    // Step to the next preset above the current pace, wrapping round
    const next = SPEED_PRESETS.find((p) => p.speed > speechSpeed + 0.01)?.speed ?? SPEED_PRESETS[0].speed;
    changeSpeed(next);
  };

  useEffect(() => {
    return () => {
      if (restartTimer.current) clearTimeout(restartTimer.current);
      runIdRef.current++;
      isPlayingRef.current = false;
      stopAllAudio();
    };
  }, []);

  if (!currentItem) {
    // No saved words yet: explain instead of showing a blank screen
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
        <SayNestBird variant="headphones" size={80} />
        <h2 className="text-xl font-bold font-serif-display text-stone-950">Nothing to play yet</h2>
        <p className="text-xs text-stone-600 max-w-xs leading-relaxed">
          Commute Audio reads out the words you save. Save a few words, then come back to listen hands-free.
        </p>
        <button
          onClick={onBack}
          className="mt-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Go back
        </button>
      </div>
    );
  }

  const primaryDef = currentItem.meanings[0]?.definitions[0]?.definition || 'No definition available.';
  const primaryEx = currentItem.meanings[0]?.definitions[0]?.example || 'No example sentence recorded.';
  const userNote = currentItem.userNote || 'No personal notes attached to this discovery.';

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-28">
      {/* Top Bar matching mockup screen 7/8 */}
      <div className="sticky top-0 z-20 bg-[#FFFDF7]/95 backdrop-blur-md px-5 py-3 border-b border-stone-200/60 flex items-center justify-between">
        <button
          onClick={() => {
            isPlayingRef.current = false;
            stopAllAudio();
            onBack();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Headphones className="w-4 h-4 text-stone-800" />
          <span>Commute mode</span>
        </h1>

        <button
          onClick={cycleSpeed}
          className="py-1 px-2.5 bg-stone-100 hover:bg-stone-200/80 rounded-lg text-xs font-mono font-bold text-stone-700"
          title="Adjust speed"
        >
          {speechSpeed.toFixed(1)}×
        </button>
      </div>

      {/* Yellow Hands-free Header Card matching ref image_bebf6ddb.png */}
      <div className="px-5 pt-3">
        <div className="bg-[#FFE042] p-5 rounded-3xl relative overflow-hidden shadow-xs text-center flex flex-col items-center">
          {/* Authentic hand-drawn subway/train illustration with windows & headphones */}
          <div className="w-full max-w-[280px] h-28 flex items-center justify-center overflow-hidden mb-2">
            <img
              src="/assets/aistudio/commute_bird.png"
              alt="Hands-free commute learning on the train with headphones"
              className="w-full h-full object-contain filter contrast-105 select-none"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-stone-950 leading-tight">
            Hands free learning for your journey.
          </h2>
          <p className="text-xs text-stone-800 leading-relaxed font-medium mt-1.5 max-w-xs mx-auto">
            We'll read the word, meaning and example aloud. Tap to control or just listen.
          </p>
        </div>
      </div>

      {/* Main Commute Media Player Card */}
      <div className="p-5 space-y-5">
        <div className="bg-[#FAF6EC] p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center text-center relative space-y-5">
          {/* Index Counter */}
          <div className="w-full flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>{currentIndex + 1} / {commutePlaylist.length}</span>
            {readingStatus !== 'done' && isPlaying && (
              <span className="px-2 py-0.5 bg-[#FFE042] text-stone-900 font-bold rounded-full text-[10px] animate-pulse">
                Reading {readingStatus}...
              </span>
            )}
          </div>

          {/* Word Display */}
          <div className="space-y-1">
            <div className={`text-3xl sm:text-4xl font-bold font-serif-display text-stone-950 tracking-tight transition-all ${
              !showText ? 'blur-md select-none' : ''
            }`}>
              {currentItem.word}
            </div>

            <div className={`flex items-center justify-center gap-2 text-stone-600 text-xs mt-1 ${
              !showText ? 'blur-sm select-none' : ''
            }`}>
              {(currentItem.phonetic || currentItem.accents[0]?.ipa) && (
                <>
                  <span className="font-mono">{currentItem.phonetic || currentItem.accents[0]?.ipa}</span>
                  <span>·</span>
                </>
              )}
              <span className="font-semibold text-stone-700">British English</span>
            </div>
          </div>

          {/* Player Controls (Prev, Big Play, Next) matching mockup screen 8 */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 shadow-xs transition-transform active:scale-90"
              aria-label="Previous word"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                isPlaying
                  ? 'bg-[#FFE042] ring-4 ring-[#FFE042]/40 scale-105'
                  : 'bg-[#FFE042] hover:bg-[#F7D836]'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-stone-950 fill-stone-950" />
              ) : (
                <Play className="w-8 h-8 text-stone-950 fill-stone-950 ml-1" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 shadow-xs transition-transform active:scale-90"
              aria-label="Next word"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Continuous Speed Slider & Presets */}
          <div className="w-full max-w-xs space-y-1.5 px-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="flex items-center gap-1 font-medium">
                <Gauge className="w-3.5 h-3.5 text-stone-500" />
                <span>Audio Pace</span>
              </span>
              <span className="font-mono font-bold text-amber-800">
                {speechSpeed < 0.9 ? 'Slow' : speechSpeed > 1.1 ? 'Fast' : 'Normal'} ({speechSpeed.toFixed(2)}×)
              </span>
            </div>

            <input
              type="range"
              min={SPEED_PRESETS[0].speed}
              max={SPEED_PRESETS[SPEED_PRESETS.length - 1].speed}
              step="0.05"
              value={speechSpeed}
              aria-label="Audio pace"
              onChange={(e) => changeSpeed(parseFloat(e.target.value), { immediate: false })}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
            />

            <div className="flex items-center justify-between gap-1 pt-0.5">
              {SPEED_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => changeSpeed(preset.speed)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    Math.abs(speechSpeed - preset.speed) < 0.03
                      ? 'bg-amber-100 text-amber-900 font-bold'
                      : 'text-stone-500 hover:text-stone-800 bg-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Male or female voice: the next line read out uses it */}
          <VoiceGenderToggle
            accent="British"
            onChange={() => {
              if (isPlayingRef.current) {
                stopAllAudio();
                runSequence(currentIndex, speechSpeed);
              }
            }}
          />

          {/* Toggles Strip matching mockup */}
          <div className="w-full pt-4 border-t border-stone-200/80 flex items-center justify-around text-xs">
            {/* Auto Play */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="font-semibold text-stone-700">Auto-play</span>
              <input
                type="checkbox"
                checked={autoPlayNext}
                onChange={(e) => setAutoPlayNext(e.target.checked)}
                className="accent-stone-900 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Show Text */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="font-semibold text-stone-700">Show text</span>
              <input
                type="checkbox"
                checked={showText}
                onChange={(e) => setShowText(e.target.checked)}
                className="accent-stone-900 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* Bottom Audio Info Drawer matching mockup */}
          <div className="w-full text-left bg-stone-900 text-white rounded-2xl p-4 space-y-3">
            {/* Tabs inside dark drawer */}
            <div className="flex items-center gap-4 text-xs font-bold border-b border-stone-800 pb-2">
              {(['Meaning', 'Example', 'Your note'] as const).map(tab => {
                const isActive = activeBottomTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveBottomTab(tab)}
                    className={`transition-colors ${
                      isActive ? 'text-[#FFE042] border-b-2 border-[#FFE042] pb-1' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <div className="text-xs leading-relaxed min-h-[48px]">
              {activeBottomTab === 'Meaning' && (
                <p className="text-stone-200 font-normal">{primaryDef}</p>
              )}
              {activeBottomTab === 'Example' && (
                <p className="text-stone-200 font-serif italic">"{primaryEx}"</p>
              )}
              {activeBottomTab === 'Your note' && (
                <p className="text-stone-300 italic">{userNote}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
