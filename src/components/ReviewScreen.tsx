import React, { useState, useEffect, useMemo } from 'react';
import { WordEntry } from '../types';
import { dueWords, estimateMinutes, ReviewRating } from '../utils/review';
import { 
  Volume2, Star, Headphones, Eye, RotateCcw, Check, 
  Sparkles, ArrowRight, ArrowLeft, Settings, Filter, Sliders, 
  BookOpen, HelpCircle, Shuffle, Award, CheckCircle2, XCircle,
  Layers, BookMarked, PenLine, Download, Gauge, Keyboard
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { SayNestBird } from './SayNestBird';
import { ExportModal } from './ExportModal';

interface ReviewScreenProps {
  words: WordEntry[];
  /** Record a rating so the word's next review date moves */
  onRateWord: (wordId: string, rating: ReviewRating) => void;
  onOpenCommuteMode: () => void;
  onFinishSession: () => void;
  onBack?: () => void;
}

export type CustomPracticeMode = 'flashcard' | 'recall' | 'listening' | 'quiz';

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  words,
  onRateWord,
  onOpenCommuteMode,
  onFinishSession,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'Today' | 'Custom' | 'Commute'>('Today');
  
  // Custom Deck Configuration
  const [customFilter, setCustomFilter] = useState<'starred' | 'transitions' | 'pride' | 'hard' | 'all'>('starred');
  const [customDeckLimit, setCustomDeckLimit] = useState<number>(10);
  const [lengthPreset, setLengthPreset] = useState<number | 'all' | 'custom'>(10);
  const [practiceMode, setPracticeMode] = useState<CustomPracticeMode>('flashcard');
  const [sortOrder, setSortOrder] = useState<'shuffle' | 'hardest' | 'recent'>('shuffle');
  const [isCustomConfiguring, setIsCustomConfiguring] = useState(false);

  // Card Progress State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [scoreCounts, setScoreCounts] = useState({ again: 0, almost: 0, gotIt: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Active Recall Mode State
  const [recallInput, setRecallInput] = useState('');
  const [recallSubmitted, setRecallSubmitted] = useState(false);

  // Quiz Mode State
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Compute Review Deck based on active mode
  const getDeck = (): WordEntry[] => {
    if (activeTab === 'Custom') {
      let filtered = [...words];
      if (customFilter === 'starred') {
        filtered = filtered.filter(w => w.isStarred);
      } else if (customFilter === 'transitions') {
        filtered = filtered.filter(w => w.type === 'transition' || w.tags?.includes('transition'));
      } else if (customFilter === 'pride') {
        filtered = filtered.filter(w => w.collectionId === 'pride-and-prejudice' || w.collectionId === 'pride-prejudice' || w.source?.title?.toLowerCase().includes('pride'));
      } else if (customFilter === 'hard') {
        filtered = filtered.filter(w => w.nuance?.cefr === 'C1' || w.nuance?.cefr === 'B2' || w.meanings.length > 1);
      }

      if (filtered.length === 0) {
        filtered = words;
      }

      if (sortOrder === 'shuffle') {
        filtered = [...filtered].sort(() => 0.5 - Math.random());
      } else if (sortOrder === 'recent') {
        filtered = [...filtered].reverse();
      }

      // If user requested more cards than the unique items in pool, repeat shuffled to build full session!
      if (customDeckLimit > filtered.length && filtered.length > 0) {
        const pool = [...filtered];
        const extended: WordEntry[] = [];
        while (extended.length < customDeckLimit) {
          const round = [...pool].sort(() => 0.5 - Math.random());
          extended.push(...round);
        }
        return extended.slice(0, customDeckLimit);
      }

      return filtered.slice(0, customDeckLimit);
    }
    // 'Today' mode: the words that are actually due
    return dueWords(words);
  };

  // The deck is fixed for a session. Rebuilding it on every render reshuffled
  // custom decks mid-card (revealing showed another card's answer), and rated
  // words would drop out of today's deck while it was being worked through.
  // sessionKey changes whenever a new session starts.
  const [sessionKey, setSessionKey] = useState(0);
  const reviewDeck = useMemo(getDeck, [activeTab, customFilter, customDeckLimit, sortOrder, sessionKey]);
  const currentCard = reviewDeck[currentIndex] || reviewDeck[0];

  // Setup Quiz Options whenever card changes
  useEffect(() => {
    if (currentCard && practiceMode === 'quiz') {
      const correctDef = currentCard.meanings[0]?.definitions[0]?.definition || '';
      const otherWords = words.filter(w => w.id !== currentCard.id);
      // Random wrong answers, so the same three don't appear on every card
      const wrongDefs = otherWords
        .map(w => w.meanings[0]?.definitions[0]?.definition)
        .filter((d): d is string => !!d && d !== correctDef)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const mixed = [correctDef, ...wrongDefs].sort(() => 0.5 - Math.random());
      setQuizOptions(mixed);
      setSelectedQuizIndex(null);
    }
    setRecallInput('');
    setRecallSubmitted(false);
  }, [currentIndex, practiceMode, currentCard?.id]);

  const handlePlayAudio = () => {
    if (!currentCard) return;
    speakWord(
      currentCard.word,
      'British',
      playbackSpeed,
      currentCard.accents[0]?.audioUrl
    );
  };

  // Auto-play audio when card changes if enabled or in listening mode
  useEffect(() => {
    if ((autoPlayAudio || practiceMode === 'listening') && currentCard) {
      handlePlayAudio();
    }
  }, [currentIndex, autoPlayAudio, practiceMode, playbackSpeed]);

  // Desktop Keyboard Shortcuts (1 = Again, 2 = Almost, 3 = Got it, Space = Reveal / Next, Arrows = Nav, R = Audio, H = Hint)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isCustomConfiguring || isCompleted) return;

      if (e.key === '1') {
        e.preventDefault();
        handleRate('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate('almost');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate('gotIt');
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (practiceMode === 'flashcard' && !isAnswerRevealed) {
          setIsAnswerRevealed(true);
        } else {
          // Advance to next card or complete
          if (currentIndex + 1 < reviewDeck.length) {
            setCurrentIndex(prev => prev + 1);
            setIsAnswerRevealed(false);
            setShowHint(false);
          } else {
            setIsCompleted(true);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setIsAnswerRevealed(false);
          setShowHint(false);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex + 1 < reviewDeck.length) {
          setCurrentIndex(prev => prev + 1);
          setIsAnswerRevealed(false);
          setShowHint(false);
        } else {
          setIsCompleted(true);
        }
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handlePlayAudio();
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowHint(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentIndex,
    reviewDeck.length,
    isAnswerRevealed,
    isCustomConfiguring,
    isCompleted,
    practiceMode,
    playbackSpeed,
    currentCard
  ]);

  const handleRate = (rating: 'again' | 'almost' | 'gotIt') => {
    if (!currentCard) return;
    setScoreCounts(prev => ({ ...prev, [rating]: prev[rating] + 1 }));
    onRateWord(currentCard.id, rating);

    if (currentIndex + 1 < reviewDeck.length) {
      setCurrentIndex(currentIndex + 1);
      setIsAnswerRevealed(false);
      setShowHint(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setSessionKey((k) => k + 1); // rebuild the deck from the latest schedule
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setShowHint(false);
    setIsCompleted(false);
    setScoreCounts({ again: 0, almost: 0, gotIt: 0 });
    setRecallInput('');
    setRecallSubmitted(false);
    setSelectedQuizIndex(null);
  };

  const handleTabChange = (tab: 'Today' | 'Custom' | 'Commute') => {
    if (tab === 'Commute') {
      onOpenCommuteMode();
      return;
    }
    setActiveTab(tab);
    handleRestart();
    if (tab === 'Custom') {
      setIsCustomConfiguring(true);
    } else {
      setIsCustomConfiguring(false);
      setPracticeMode('flashcard');
    }
  };

  // Count available items for each custom filter
  const getFilterCount = (filterId: typeof customFilter) => {
    if (filterId === 'starred') return words.filter(w => w.isStarred).length;
    if (filterId === 'transitions') return words.filter(w => w.type === 'transition' || w.tags?.includes('transition')).length;
    if (filterId === 'pride') return words.filter(w => w.collectionId === 'pride-and-prejudice' || w.collectionId === 'pride-prejudice' || w.source?.title?.toLowerCase().includes('pride')).length;
    if (filterId === 'hard') return words.filter(w => w.nuance?.cefr === 'C1' || w.nuance?.cefr === 'B2').length;
    return words.length;
  };

  const currentAvailableTotal = getFilterCount(customFilter) || words.length;

  if (!currentCard && words.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <SayNestBird variant="nest" size={80} />
        <h2 className="text-xl font-bold font-serif-display">Your nest is clear!</h2>
        <p className="text-sm text-stone-600">No words currently due for review.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="py-2 px-4 bg-stone-900 text-white rounded-xl text-xs font-bold"
          >
            Back to Home
          </button>
        )}
      </div>
    );
  }

  // Create masked sentence for recall mode
  const getMaskedExample = () => {
    const rawExample = currentCard.meanings[0]?.definitions[0]?.example || '';
    if (!rawExample) return null;
    const regex = new RegExp(`\\b${currentCard.word}\\b`, 'gi');
    return rawExample.replace(regex, '__________');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-36 md:pb-20">
      {/* Top Header matching Mockup Screen 7: Back Arrow + Title "Review" + Settings Gear (No redundant yellow commute pill!) */}
      <div className="sticky top-0 z-20 bg-[#FFFDF7]/95 backdrop-blur-md px-5 py-3 border-b border-stone-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold font-serif-display text-stone-950">Review</h1>
        </div>

        {/* Clean Settings Gear matching mockup */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
            title="Review session settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-30 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-900">Session Settings</span>
                <span className="text-[11px] font-mono text-stone-500">{playbackSpeed.toFixed(2)}x speed</span>
              </div>

              {/* Continuous Audio Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-700">
                  <span className="flex items-center gap-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-stone-500" />
                    <span>Pronunciation Speed</span>
                  </span>
                  <span className="font-mono font-bold text-amber-700">
                    {playbackSpeed <= 0.75 ? 'Slow' : playbackSpeed >= 1.25 ? 'Fast' : 'Normal'} ({playbackSpeed.toFixed(2)}x)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPlaybackSpeed(0.75)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      Math.abs(playbackSpeed - 0.75) < 0.03
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'text-stone-500 hover:text-stone-800 bg-stone-100'
                    }`}
                  >
                    0.75x Slow
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaybackSpeed(1.0)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      Math.abs(playbackSpeed - 1.0) < 0.03
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'text-stone-500 hover:text-stone-800 bg-stone-100'
                    }`}
                  >
                    1.0x Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaybackSpeed(1.25)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      Math.abs(playbackSpeed - 1.25) < 0.03
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'text-stone-500 hover:text-stone-800 bg-stone-100'
                    }`}
                  >
                    1.25x Fast
                  </button>
                </div>
              </div>

              {/* Auto-play pronunciation */}
              <label className="flex items-center justify-between text-xs text-stone-700 cursor-pointer pt-1 border-t border-stone-100">
                <span className="font-medium">Auto-play pronunciation</span>
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(e) => setAutoPlayAudio(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Export Deck Option */}
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setIsExportModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-[#FAF6EC] hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 border border-stone-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-stone-700" />
                <span>Export Deck (Anki / Print PDF)</span>
              </button>

              {/* Commute Audio Switch */}
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  onOpenCommuteMode();
                }}
                className="w-full py-2 px-3 bg-[#FFE042] hover:bg-[#F7D836] rounded-xl text-xs font-bold text-stone-900 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Switch to Commute Audio</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6">

        {/* Segmented Control: Today, Custom, Commute mode matching reference mockup */}
        <div className="pt-4 pb-2">
          <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-2xl max-w-sm">
            <button
              onClick={() => handleTabChange('Today')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'Today' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleTabChange('Custom')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'Custom' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Custom
            </button>
            <button
              onClick={() => handleTabChange('Commute')}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center justify-center gap-1"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Commute</span>
            </button>
          </div>
        </div>

        {/* Custom Deck Configuration Panel */}
        {activeTab === 'Custom' && isCustomConfiguring ? (
          <div className="my-3 p-5 bg-[#FAF6EC] rounded-3xl border border-stone-200 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-serif-display">Customize Your Review Deck</h3>
                <p className="text-xs text-stone-600">Tailor your cards, drill modes, and session lengths.</p>
              </div>
              <Sliders className="w-5 h-5 text-stone-600" />
            </div>

            {/* 1. Target Deck Filter */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-2">1. Select Vocabulary Source</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'starred', label: 'Starred Discoveries', icon: Star, count: getFilterCount('starred'), activeIconClass: 'fill-amber-400 text-amber-500' },
                  { id: 'transitions', label: 'Rhetorical Transitions', icon: Layers, count: getFilterCount('transitions') },
                  { id: 'pride', label: 'Pride & Prejudice', icon: BookOpen, count: getFilterCount('pride') },
                  { id: 'hard', label: 'Advanced Words (B2–C1)', icon: Sparkles, count: getFilterCount('hard') },
                  { id: 'all', label: 'Entire Nest Library', icon: BookMarked, count: words.length },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = customFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCustomFilter(item.id as any);
                        if (lengthPreset === 'all') {
                          setCustomDeckLimit(getFilterCount(item.id as any));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-[#FFE042] border-[#FFE042] text-stone-950 font-bold shadow-xs ring-2 ring-stone-900/10'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Icon className={`w-3.5 h-3.5 ${item.activeIconClass || (isSelected ? 'text-stone-950' : 'text-stone-500')}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1 pl-5">{item.count} items in pool</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Practice Mode & Drill Style */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-2">2. Practice Mode & Drill Style</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'flashcard', title: 'Flashcards', desc: 'Classic reveal & pronunciation', icon: Eye },
                  { id: 'recall', title: 'Active Recall', desc: 'Fill-in blank & guess word', icon: PenLine },
                  { id: 'listening', title: 'Ear Training', desc: 'Listen to accent before seeing', icon: Volume2 },
                  { id: 'quiz', title: 'Quick Quiz', desc: '4-choice definition drill', icon: CheckCircle2 },
                ].map((mode) => {
                  const ModeIcon = mode.icon;
                  const isSelected = practiceMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPracticeMode(mode.id as CustomPracticeMode)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <ModeIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FFE042]' : 'text-stone-600'}`} />
                        <span>{mode.title}</span>
                      </div>
                      <div className={`text-[10px] mt-1 pl-5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {mode.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Session Length: Presets + Stepper */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700">3. Session Length</label>
                <span className="text-[11px] text-stone-500 font-medium">
                  {currentAvailableTotal} unique in pool
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                {[5, 10, 15, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCustomDeckLimit(num);
                      setLengthPreset(num);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      lengthPreset === num
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-700'
                    }`}
                  >
                    {num} Cards
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCustomDeckLimit(currentAvailableTotal);
                    setLengthPreset('all');
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    lengthPreset === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-700'
                  }`}
                >
                  All ({currentAvailableTotal})
                </button>
              </div>

              {/* Exact Custom Stepper Input */}
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 max-w-xs">
                <span className="text-xs text-stone-600 font-medium pl-1">Or enter exact count:</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, customDeckLimit - 1);
                    setCustomDeckLimit(next);
                    setLengthPreset('custom');
                  }}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={customDeckLimit}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setCustomDeckLimit(val);
                    setLengthPreset('custom');
                  }}
                  className="w-16 text-center py-1 px-1 bg-stone-50 rounded-lg border border-stone-200 font-bold text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#FFE042]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomDeckLimit(customDeckLimit + 1);
                    setLengthPreset('custom');
                  }}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center text-sm"
                >
                  +
                </button>
                <span className="text-xs text-stone-400 font-mono">cards</span>
              </div>

              {customDeckLimit > currentAvailableTotal && (
                <div className="text-[11px] text-amber-900 font-medium bg-amber-50/90 p-2.5 rounded-xl border border-amber-200/70 mt-2.5 flex items-center gap-2">
                  <span className="font-bold">Note:</span>
                  <span>
                    Selected source has {currentAvailableTotal} unique cards. Cards will cycle shuffled for a complete {customDeckLimit}-card session.
                  </span>
                </div>
              )}
            </div>

            {/* Launch Button */}
            <button
              onClick={() => {
                setIsCustomConfiguring(false);
                handleRestart();
              }}
              className="w-full py-3.5 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 rounded-2xl text-xs font-bold shadow-xs transition-transform active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Launch Custom Review ({reviewDeck.length} cards · {practiceMode})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : reviewDeck.length === 0 ? (
          /* Nothing due (or nothing saved yet) */
          <div className="my-6 text-center p-8 bg-[#FAF6EC] rounded-3xl border border-stone-200 space-y-3">
            <SayNestBird variant="flag" size={80} />
            <h2 className="text-2xl font-bold font-serif-display text-stone-950">
              {words.length === 0 ? 'Nothing to review yet' : 'All caught up!'}
            </h2>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
              {words.length === 0
                ? 'Save a few words and they will show up here for review.'
                : 'No words are due right now. Each word comes back when it is time to refresh it.'}
            </p>
            {words.length > 0 && (
              <button
                onClick={() => handleTabChange('Custom')}
                className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                Practise anyway <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Session Progress Card matching mockup */}
            <div className="pt-2 pb-4">
              <div className="bg-[#FFE042] p-4 rounded-3xl shadow-xs relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1 z-10 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">
                      {activeTab === 'Custom' ? `Custom · ${practiceMode.toUpperCase()}` : "Today's session"}
                    </span>
                    {activeTab === 'Custom' && (
                      <button
                        onClick={() => setIsCustomConfiguring(true)}
                        className="text-[11px] underline font-bold text-stone-800 hover:text-stone-950"
                      >
                        (Change Options)
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-stone-700 font-medium">
                    {reviewDeck.length} {reviewDeck.length === 1 ? 'word' : 'words'} · ~ {estimateMinutes(reviewDeck.length)} min
                  </div>
                  {/* Progress bar */}
                  <div className="w-full max-w-[200px] bg-stone-900/15 h-2 rounded-full mt-2 overflow-hidden flex items-center">
                    <div
                      className="bg-stone-900 h-full rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / reviewDeck.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 z-10">
                  <span className="text-xs font-mono font-bold text-stone-900">
                    {currentIndex + 1} / {reviewDeck.length}
                  </span>
                  <div className="shrink-0 -mr-2">
                    <SayNestBird variant="study" size={68} />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Review Body */}
            <div className="flex-1 flex flex-col justify-between">
              {isCompleted ? (
                /* Completion Screen */
                <div className="my-auto text-center p-6 bg-[#FAF6EC] rounded-3xl border border-stone-200 space-y-4">
                  <SayNestBird variant="flag" size={80} />
                  <h2 className="text-2xl font-bold font-serif-display text-stone-950">
                    Session Complete!
                  </h2>
                  <p className="text-xs text-stone-600 max-w-xs mx-auto">
                    You reviewed {reviewDeck.length} {reviewDeck.length === 1 ? 'word' : 'words'}. Words you knew will come
                    back in a few days; ones marked "Again" come back soon.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                      <div className="text-xs text-rose-600 font-bold">Again</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">{scoreCounts.again}</div>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="text-xs text-amber-600 font-bold">Almost</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">{scoreCounts.almost}</div>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="text-xs text-emerald-600 font-bold">Got it</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">{scoreCounts.gotIt}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleRestart}
                      className="flex-1 py-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Review Again
                    </button>
                    <button
                      onClick={onOpenCommuteMode}
                      className="flex-1 py-3 bg-[#FFE042] hover:bg-[#F7D836] rounded-2xl text-xs font-bold text-stone-900 flex items-center justify-center gap-1.5"
                    >
                      <Headphones className="w-4 h-4" />
                      Commute Mode
                    </button>
                  </div>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full py-2.5 px-3 bg-white hover:bg-stone-100 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-600" />
                    <span>Export Deck to Anki (.txt) / Print Study Cards</span>
                  </button>
                </div>
              ) : (
                /* Card Body based on Practice Mode */
                <div className="bg-[#FAF6EC] p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center text-center relative space-y-4">
                  {/* Top Prompt Badge & Star */}
                  <div className="w-full flex items-center justify-between">
                    <span className="py-1 px-3 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold">
                      {practiceMode === 'recall' ? 'Meaning → Word (Recall)' : practiceMode === 'listening' ? 'Ear Training (Listen)' : practiceMode === 'quiz' ? 'Multiple Choice Drill' : 'Word → Meaning'}
                    </span>
                    <button
                      className="text-stone-300 hover:text-amber-500"
                      aria-label="Star"
                    >
                      <Star className={`w-4 h-4 ${currentCard.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* ACTIVE RECALL MODE */}
                  {practiceMode === 'recall' ? (
                    <div className="w-full space-y-4">
                      <div className="text-xs text-stone-500 font-medium">Can you recall the word from this meaning?</div>
                      <div className="p-4 bg-white rounded-2xl border border-stone-200 text-left space-y-2">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Meaning</div>
                        <p className="text-sm text-stone-900 font-semibold leading-relaxed">
                          {currentCard.meanings[0]?.definitions[0]?.definition}
                        </p>
                      </div>

                      {getMaskedExample() && (
                        <div className="p-3 bg-[#FCF9F2] rounded-xl border border-stone-200/80 text-xs font-serif italic text-stone-700 text-left">
                          "{getMaskedExample()}"
                        </div>
                      )}

                      {!recallSubmitted ? (
                        <div className="space-y-3 pt-2">
                          <input
                            type="text"
                            value={recallInput}
                            onChange={(e) => setRecallInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && recallInput.trim()) {
                                setRecallSubmitted(true);
                              }
                            }}
                            placeholder="Type the word here..."
                            className="w-full p-3 bg-white rounded-xl border border-stone-300 text-center font-bold text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowHint(!showHint)}
                              className="flex-1 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600"
                            >
                              {showHint ? `Starts with: "${currentCard.word.slice(0, 2)}..."` : 'Show letter hint'}
                            </button>
                            <button
                              onClick={() => setRecallSubmitted(true)}
                              className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
                            >
                              Check Answer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2 animate-in fade-in">
                          <div className={`p-3 rounded-2xl border font-bold text-base flex items-center justify-center gap-2 ${
                            recallInput.trim().toLowerCase() === currentCard.word.toLowerCase()
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-rose-50 border-rose-300 text-rose-800'
                          }`}>
                            {recallInput.trim().toLowerCase() === currentCard.word.toLowerCase() ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span>Correct! "{currentCard.word}"</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-rose-600" />
                                <span>The answer is: "{currentCard.word}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : practiceMode === 'quiz' ? (
                    /* MULTIPLE CHOICE QUIZ MODE */
                    <div className="w-full space-y-4">
                      <div className="text-xs text-stone-500 font-medium">Select the matching definition:</div>
                      <div className="text-3xl font-bold font-serif-display text-stone-950">
                        {currentCard.word}
                      </div>
                      <div className="space-y-2 pt-2">
                        {quizOptions.map((opt, idx) => {
                          const isCorrect = opt === currentCard.meanings[0]?.definitions[0]?.definition;
                          const isSelected = selectedQuizIndex === idx;
                          let btnStyle = 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800';
                          if (selectedQuizIndex !== null) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                            } else if (isSelected) {
                              btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-semibold';
                            }
                          }
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (selectedQuizIndex === null) {
                                  setSelectedQuizIndex(idx);
                                }
                              }}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-mono text-stone-400">{String.fromCharCode(65 + idx)}.</span>
                                <span className="flex-1">{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* CLASSIC FLASHCARD & LISTENING MODE matching Figma Screen 6 */
                    <>
                      <div className="text-xs text-stone-500 font-medium">
                        {practiceMode === 'listening' ? 'Listen to the audio pronunciation:' : 'What does this mean?'}
                      </div>

                      {/* Word Title (Hidden until revealed in Listening mode) */}
                      {practiceMode === 'listening' && !isAnswerRevealed ? (
                        <div className="text-2xl font-bold font-mono text-stone-400 tracking-widest my-2">
                          ••••••••••••
                        </div>
                      ) : (
                        <div className="text-3xl sm:text-4xl font-bold font-serif-display text-stone-950 tracking-tight">
                          {currentCard.word}
                        </div>
                      )}

                      {/* Phonetic & Accent */}
                      <div className="flex items-center gap-2 text-stone-600 text-xs">
                        <span className="font-mono">{currentCard.phonetic || currentCard.accents[0]?.ipa}</span>
                        <span>·</span>
                        <span>🇬🇧 British English</span>
                      </div>

                      {/* Audio Button */}
                      <div className="relative my-1">
                        <button
                          onClick={handlePlayAudio}
                          className="w-14 h-14 rounded-full bg-[#FFE042] hover:bg-[#F7D836] shadow-sm flex items-center justify-center transition-transform active:scale-95"
                          aria-label="Play pronunciation"
                          title="Play pronunciation (R)"
                        >
                          <Volume2 className="w-6 h-6 text-stone-900" />
                        </button>
                        <span className="hidden sm:inline-block absolute -bottom-1 -right-1 font-mono text-[9px] font-bold text-stone-600 bg-white/95 border border-stone-200 px-1 py-0.2 rounded shadow-2xs">
                          R
                        </span>
                      </div>

                      {/* Expressive Bird Mascot sitting happily */}
                      <SayNestBird variant="flashcard" size={82} />

                      {/* Hint pill button */}
                      <div className="w-full flex justify-center">
                        {!showHint ? (
                          <button
                            type="button"
                            onClick={() => setShowHint(true)}
                            className="py-1.5 px-4 bg-white/90 hover:bg-white rounded-full text-xs font-medium text-stone-600 border border-stone-200 transition-colors flex items-center gap-1.5"
                          >
                            <span>Show hint (first letter: "{currentCard.meanings[0]?.definitions[0]?.definition.slice(0, 1)}...")</span>
                            <span className="hidden sm:inline-block font-mono text-[9px] text-stone-400 bg-stone-100 px-1 rounded">H</span>
                          </button>
                        ) : (
                          <div className="p-2 px-4 bg-amber-50/90 rounded-full text-xs text-amber-900 font-medium flex items-center gap-1.5 border border-amber-200/60">
                            <span className="font-bold">Hint:</span>
                            <span>Starts with "{currentCard.meanings[0]?.definitions[0]?.definition.slice(0, 10)}..."</span>
                          </div>
                        )}
                      </div>

                      {/* Rating Buttons Always Visible matching Figma Screen 6 (image_0de423d9.png) */}
                      <div className="w-full pt-2">
                        <div className="grid grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleRate('again')}
                            className="py-3 px-2 bg-[#FFAAA6] hover:bg-[#FF9691] text-stone-900 font-bold text-xs rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xs relative"
                          >
                            <RotateCcw className="w-4 h-4 mb-1" />
                            <span>Again</span>
                            <span className="hidden sm:inline-block font-mono text-[9px] text-stone-700 bg-white/70 px-1.5 py-0.2 rounded mt-1">1</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRate('almost')}
                            className="py-3 px-2 bg-[#F3E2C4] hover:bg-[#EBD2AB] text-stone-900 font-bold text-xs rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xs relative"
                          >
                            <span className="text-base leading-none mb-1">~</span>
                            <span>Almost</span>
                            <span className="hidden sm:inline-block font-mono text-[9px] text-stone-700 bg-white/70 px-1.5 py-0.2 rounded mt-1">2</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRate('gotIt')}
                            className="py-3 px-2 bg-[#B7E4C7] hover:bg-[#9CD7B1] text-stone-900 font-bold text-xs rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xs relative"
                          >
                            <Check className="w-4 h-4 mb-1" />
                            <span>Got it</span>
                            <span className="hidden sm:inline-block font-mono text-[9px] text-stone-700 bg-white/70 px-1.5 py-0.2 rounded mt-1">3</span>
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Example & Meaning Block matching Figma Screen 6 */}
                      <div className="w-full pt-1 space-y-2">
                        <div className="bg-white/80 rounded-2xl border border-stone-200/90 p-3.5 text-left transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-800">
                              {isAnswerRevealed ? 'Definition & example sentence' : 'Example sentence (after answer)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
                              title={isAnswerRevealed ? 'Hide details' : 'Reveal details'}
                            >
                              <Eye className={`w-3.5 h-3.5 ${isAnswerRevealed ? 'text-amber-600' : ''}`} />
                            </button>
                          </div>

                          {isAnswerRevealed ? (
                            <div className="mt-3 pt-2 border-t border-stone-100 space-y-2 animate-in fade-in">
                              <div className="text-xs text-stone-900 font-medium leading-relaxed">
                                <span className="font-bold text-stone-400 uppercase text-[10px] mr-1 block">Meaning:</span>
                                {currentCard.meanings[0]?.definitions[0]?.definition}
                              </div>
                              {currentCard.meanings[0]?.definitions[0]?.example && (
                                <div className="text-xs font-serif italic text-stone-700 bg-[#FAF6EC] p-2.5 rounded-xl border border-stone-200/70">
                                  <span className="font-sans font-bold not-italic mr-1 text-stone-400">&gt;</span>
                                  "{currentCard.meanings[0]?.definitions[0]?.example}"
                                </div>
                              )}
                            </div>
                          ) : (
                            currentCard.meanings[0]?.definitions[0]?.example && (
                              <div className="text-xs font-serif italic text-stone-500 mt-2 line-clamp-1">
                                <span className="font-sans font-bold not-italic mr-1 text-stone-400">&gt;</span>
                                "{currentCard.meanings[0]?.definitions[0]?.example.slice(0, 45)}..."
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rating Buttons for Recall & Quiz modes if user wants to rate */}
                  {(practiceMode === 'recall' || practiceMode === 'quiz') && (
                    <div className="w-full pt-2">
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleRate('again')}
                          className="py-2.5 px-2 bg-[#FFAAA6] hover:bg-[#FF9691] text-stone-900 font-bold text-xs rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mb-0.5" />
                          <span>Again</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRate('almost')}
                          className="py-2.5 px-2 bg-[#F3E2C4] hover:bg-[#EBD2AB] text-stone-900 font-bold text-xs rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xs"
                        >
                          <span className="text-sm leading-none mb-0.5">~</span>
                          <span>Almost</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRate('gotIt')}
                          className="py-2.5 px-2 bg-[#B7E4C7] hover:bg-[#9CD7B1] text-stone-900 font-bold text-xs rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 mb-0.5" />
                          <span>Got it</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card Navigation Controls: Previous Card & Next / Skip */}
                  <div className="w-full pt-2 flex items-center justify-between border-t border-stone-200/70 text-xs">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => {
                        if (currentIndex > 0) {
                          setCurrentIndex(currentIndex - 1);
                          setIsAnswerRevealed(false);
                          setShowHint(false);
                        }
                      }}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-semibold transition-colors ${
                        currentIndex === 0
                          ? 'text-stone-300 cursor-not-allowed'
                          : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                      <span className="hidden sm:inline-block font-mono text-[9px] text-stone-400 bg-stone-100 px-1 py-0.2 rounded">←</span>
                    </button>

                    <span className="text-[11px] font-mono text-stone-400">
                      Card {currentIndex + 1} of {reviewDeck.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentIndex + 1 < reviewDeck.length) {
                          setCurrentIndex(currentIndex + 1);
                          setIsAnswerRevealed(false);
                          setShowHint(false);
                        } else {
                          setIsCompleted(true);
                        }
                      }}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-bold text-stone-900 hover:bg-stone-200/60 transition-colors"
                    >
                      <span>{currentIndex + 1 < reviewDeck.length ? 'Next Card' : 'Finish'}</span>
                      <span className="hidden sm:inline-block font-mono text-[9px] text-stone-500 bg-stone-200/60 px-1 py-0.2 rounded">→</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Keyboard Shortcuts Helper Ribbon */}
              {!isCompleted && !isCustomConfiguring && (
                <div className="hidden sm:flex items-center justify-center gap-3 pt-3 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Keyboard className="w-3.5 h-3.5 text-stone-400" />
                    <kbd className="px-1.5 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">Space</kbd>
                    <span>{practiceMode === 'flashcard' && !isAnswerRevealed ? 'Reveal' : 'Next'}</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="px-1 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">1</kbd>
                    <kbd className="px-1 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">2</kbd>
                    <kbd className="px-1 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">3</kbd>
                    <span>Again / Almost / Got it</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="px-1 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">R</kbd>
                    <span>Audio</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="px-1 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">←</kbd>
                    <kbd className="px-1 py-0.5 bg-stone-200/80 border border-stone-300 rounded font-mono text-[10px] text-stone-800 font-bold">→</kbd>
                    <span>Nav</span>
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Export Deck Modal */}
      {isExportModalOpen && (
        <ExportModal
          title={activeTab === 'Custom' ? 'Custom Review Deck' : 'Today Review Session'}
          words={reviewDeck}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};
