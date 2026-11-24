import React, { useState, useRef, useEffect } from 'react';
import { WordEntry } from '../types';
import { TRANSITION_CATEGORIES } from '../data/initialData';
import { 
  Volume2, Star, Search, Bookmark, ChevronRight, Sparkles, 
  Plus, Check, ArrowLeft, BookOpen, User, Library,
  Mic, MicOff, RotateCcw, X
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { clickableProps } from '../utils/a11y';
import {
  SpokenCheck,
  checkSpoken,
  transcriptsFromEvent,
  isSpeechRecognitionSupported,
  recognitionErrorMessage,
  UNSUPPORTED_MESSAGE,
} from '../utils/speechCheck';
import { SayNestBird } from './SayNestBird';
import { SpokenCheckResult } from './SpokenCheckResult';

// Saved phrases with no category tag are listed under "Other" in My Saved
const OTHER_CATEGORY = { id: 'other', name: 'Other', count: 0, description: '', examples: [] as WordEntry[] };

// Whether a saved expression belongs to a category. Tags may use the id
// ("cause-reason"), a slash form ("cause/reason") or the name.
const inCategory = (w: WordEntry, cat: { id: string; name: string }) =>
  (w.tags || []).some((t) => {
    const tag = t.toLowerCase().replace(/\//g, '-');
    return tag === cat.id || tag === cat.name.toLowerCase().replace(/\s*\/\s*|\s+/g, '-');
  });

interface ExpressionsScreenProps {
  userSavedTransitions: WordEntry[];
  onSelectWord: (word: WordEntry) => void;
  /** Look up a phrase that isn't in the catalog */
  onSearchLookup?: (phrase: string) => void;
  onOpenSaveModal: (word: WordEntry) => void;
  onBackToHome?: () => void;
  onAddCustomExpression: (expr: WordEntry) => void;
}

export const ExpressionsScreen: React.FC<ExpressionsScreenProps> = ({
  userSavedTransitions,
  onSelectWord,
  onSearchLookup,
  onOpenSaveModal,
  onBackToHome,
  onAddCustomExpression
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<'catalog' | 'my-saved'>('catalog');
  const [selectedCategoryId, setSelectedCategoryId] = useState('addition');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New expression form state
  const [newPhrase, setNewPhrase] = useState('');
  const [newCategory, setNewCategory] = useState('addition');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newBestUsed, setNewBestUsed] = useState('');

  // Speech-to-Text Dictation in Add Modal
  const [isDictating, setIsDictating] = useState(false);
  const [dictatingTarget, setDictatingTarget] = useState<'phrase' | 'meaning' | 'example' | null>(null);
  const [rawSpokenText, setRawSpokenText] = useState('');
  const [cleanedSpokenText, setCleanedSpokenText] = useState('');
  // Shown in the form instead of a browser alert (or silently failing)
  const [dictationError, setDictationError] = useState<string | null>(null);
  const dictationRecognitionRef = useRef<any>(null);

  // Speech-to-Text Practice in Detail Card
  const [isPracticingSpeech, setIsPracticingSpeech] = useState(false);
  const [practiceCheck, setPracticeCheck] = useState<SpokenCheck | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const practiceRecognitionRef = useRef<any>(null);

  // Saved expressions that don't fit any category
  const uncategorizedSaved = userSavedTransitions.filter(w => !TRANSITION_CATEGORIES.some(c => inCategory(w, c)));
  const showOther = activeSourceTab === 'my-saved' && uncategorizedSaved.length > 0;
  const categoryList = showOther ? [...TRANSITION_CATEGORIES, OTHER_CATEGORY] : TRANSITION_CATEGORIES;

  // Find active category
  const activeCategory = categoryList.find(c => c.id === selectedCategoryId) || TRANSITION_CATEGORIES[0];

  // "Other" only exists in My Saved; leaving it falls back to the first category
  useEffect(() => {
    if (selectedCategoryId === 'other' && !showOther) setSelectedCategoryId(TRANSITION_CATEGORIES[0].id);
  }, [selectedCategoryId, showOther]);

  // Selected expression within category
  const [selectedExpression, setSelectedExpression] = useState<WordEntry>(() => {
    return activeCategory.examples[0] || {
      id: 'default',
      word: 'By the same token',
      type: 'transition',
      phonetic: '/baɪ ðə seɪm ˈtoʊ.kən/',
      accents: [{ accent: 'British', ipa: '/baɪ ðə seɪm ˈtəʊ.kən/', flag: '🇬🇧', langCode: 'en-GB' }],
      meanings: [{
        partOfSpeech: 'transition',
        definitions: [{
          definition: 'Used to introduce something that is true for the same reason as what has just been mentioned.',
          example: 'We cannot expect students to meet every deadline; by the same token, deadlines cannot simply be ignored.'
        }]
      }],
      dateAdded: new Date().toISOString(),
      tags: ['transition']
    };
  });

  // Calculate dynamic category counts so they strictly align with available entries
  // (It used to count every saved transition in every category, because any
  // word tagged "transition" matched, so all the counts were the same.)
  const savedInCategory = (category: { id: string; name: string }) =>
    category.id === 'other' ? uncategorizedSaved : userSavedTransitions.filter(w => inCategory(w, category));

  const getCategoryCount = (category: typeof TRANSITION_CATEGORIES[0]) =>
    activeSourceTab === 'catalog' ? category.examples.length : savedInCategory(category).length;

  // Strip leading verbal artifacts like "the transition is", "the transition", "the expression is"
  const cleanSpokenPhrase = (raw: string) => {
    let cleaned = raw.trim();
    // Remove "the transition is", "the transition", "transition is", "the expression is", "the phrase is", etc.
    cleaned = cleaned.replace(/^(the\s+)?(transition|expression|phrase)\s+(is|are|called|named|was)?\s*[:,-]?\s*/i, '');
    cleaned = cleaned.replace(/^(the\s+)?(transition|expression|phrase)\s*[:,-]?\s*/i, '');
    cleaned = cleaned.replace(/^[.,/#!$%^&*;:{}=\-_`~()]+\s*/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  };

  // Speech-to-Text Handler for Modal Inputs
  const startFieldDictation = (field: 'phrase' | 'meaning' | 'example') => {
    if (typeof window === 'undefined') return;
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setDictationError(UNSUPPORTED_MESSAGE);
      return;
    }
    setDictationError(null);

    try {
      if (dictationRecognitionRef.current) {
        try { dictationRecognitionRef.current.abort(); } catch {}
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      dictationRecognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      setDictatingTarget(field);
      setIsDictating(true);
      setRawSpokenText('');
      setCleanedSpokenText('');

      rec.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }
        const text = (finalChunk || interimChunk).trim();
        setRawSpokenText(text);

        if (field === 'phrase') {
          const cleaned = cleanSpokenPhrase(text);
          setCleanedSpokenText(cleaned);
          setNewPhrase(cleaned);
        } else if (field === 'meaning') {
          setNewMeaning(text);
        } else if (field === 'example') {
          setNewExample(text);
        }

        if (finalChunk) {
          setIsDictating(false);
          setDictatingTarget(null);
        }
      };

      rec.onerror = (e: any) => {
        setIsDictating(false);
        setDictatingTarget(null);
        if (e.error !== 'aborted') setDictationError(recognitionErrorMessage(e.error));
      };

      rec.onend = () => {
        setIsDictating(false);
        setDictatingTarget(null);
      };

      rec.start();
    } catch (err) {
      setIsDictating(false);
      setDictatingTarget(null);
    }
  };

  // Speech-to-Text Pronunciation Practice Handler in Detail Card
  const resetPractice = () => {
    setPracticeCheck(null);
    setPracticeError(null);
  };

  // A result belongs to the phrase it was spoken for; clear it when switching
  useEffect(() => {
    resetPractice();
  }, [selectedExpression?.word]);

  const startPracticeSpeech = () => {
    if (typeof window === 'undefined' || !selectedExpression) return;
    resetPractice();
    if (!isSpeechRecognitionSupported()) {
      setPracticeError(UNSUPPORTED_MESSAGE);
      return;
    }

    try {
      if (practiceRecognitionRef.current) {
        try { practiceRecognitionRef.current.abort(); } catch {}
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      practiceRecognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      rec.lang = 'en-GB';
      const target = selectedExpression.word;

      // Browsers sometimes stop listening with neither a result nor an error
      let settled = false;
      setIsPracticingSpeech(true);

      rec.onresult = (event: any) => {
        settled = true;
        setPracticeCheck(checkSpoken(target, transcriptsFromEvent(event)));
        setIsPracticingSpeech(false);
      };

      rec.onerror = (e: any) => {
        settled = true;
        setIsPracticingSpeech(false);
        setPracticeError(recognitionErrorMessage(e.error));
      };

      rec.onend = () => {
        setIsPracticingSpeech(false);
        if (!settled) setPracticeError(recognitionErrorMessage('no-speech'));
      };

      rec.start();
    } catch {
      setIsPracticingSpeech(false);
      setPracticeError('Could not start the microphone. Please try again.');
    }
  };

  const handlePlayAudio = (phrase: string) => {
    setIsPlayingAudio(true);
    speakWord(
      phrase,
      'British',
      1.0,
      undefined,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;

    const customEntry: WordEntry = {
      id: `custom-expr-${Date.now()}`,
      word: newPhrase.trim(),
      type: 'transition',
      // No made-up pronunciation; the phrase is read aloud by the voice instead
      phonetic: '',
      accents: [
        { accent: 'British', ipa: '', flag: '🇬🇧', langCode: 'en-GB' },
        { accent: 'American', ipa: '', flag: '🇺🇸', langCode: 'en-US' }
      ],
      meanings: [
        {
          partOfSpeech: 'transition',
          definitions: [
            {
              definition: newMeaning.trim() || 'Custom rhetorical transition added to personal nest.',
              example: newExample.trim() || undefined
            }
          ]
        }
      ],
      nuance: {
        bestUsedWhen: newBestUsed.trim() ? [newBestUsed.trim()] : ['Custom rhetoric note.'],
        formality: 'Formal'
      },
      dateAdded: new Date().toISOString(),
      groupDate: 'Today',
      tags: ['transition', newCategory, 'my-own']
    };

    onAddCustomExpression(customEntry);
    setSelectedExpression(customEntry);
    setActiveSourceTab('my-saved');
    setIsAddModalOpen(false);

    // reset
    setNewPhrase('');
    setNewMeaning('');
    setNewExample('');
    setNewBestUsed('');
    setRawSpokenText('');
    setCleanedSpokenText('');
  };

  // Expressions displayed based on tab (Curated catalog vs My saved transitions)
  const baseList: WordEntry[] = activeSourceTab === 'catalog'
    ? activeCategory.examples
    : savedInCategory(activeCategory);

  const displayedExpressions: WordEntry[] = baseList.filter(expr => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      expr.word.toLowerCase().includes(q) ||
      expr.meanings.some(m => m.definitions.some(d => d.definition.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-36 md:pb-20">
      {/* Sticky Pinned Top Navigation Bar - Never disappears on scroll! */}
      <div className="sticky top-0 z-30 bg-[#FFE042]/95 backdrop-blur-md px-5 py-3 border-b border-stone-900/10 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-stone-900 transition-colors shadow-2xs shrink-0"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <span className="font-bold text-base sm:text-lg font-serif-display text-stone-950">
            Expressions & Transitions
          </span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-1.5 px-3 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-[#FFE042]" />
          <span className="hidden sm:inline">Add Expression</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Top Banner with Mascot & Catalog Switcher */}
      <div className="bg-[#FFE042] px-6 pt-3 pb-6 rounded-b-3xl relative overflow-hidden shadow-xs">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-stone-950 tracking-tight leading-tight">
              Rhetorical Connectors & Nuances
            </h1>
            <p className="text-xs sm:text-sm text-stone-800 font-medium mt-0.5">
              Refined connectors, transitional phrases, and reasoning markers for writing and speaking.
            </p>
          </div>

          <div className="hidden sm:block shrink-0 -mt-2 -mr-1">
            <SayNestBird variant="flag" size={76} />
          </div>
        </div>

        {/* Source Switcher: Curated Catalog vs My Saved Words */}
        <div className="mt-4 pt-2 border-t border-stone-900/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-1.5 p-1 bg-black/10 rounded-2xl">
            <button
              onClick={() => setActiveSourceTab('catalog')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSourceTab === 'catalog'
                  ? 'bg-stone-950 text-white shadow-xs'
                  : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Catalog</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('my-saved')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSourceTab === 'my-saved'
                  ? 'bg-stone-950 text-white shadow-xs'
                  : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Saved ({userSavedTransitions.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-1.5 px-3.5 bg-white hover:bg-stone-50 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add My Expression</span>
          </button>
        </div>
      </div>

      {/* Responsive 3-Column / 2-Column Desktop Grid Layout */}
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Purpose Categories */}
        <div className="md:col-span-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
            <span>By Purpose</span>
            <span>{TRANSITION_CATEGORIES.length}</span>
          </div>

          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categoryList.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    if (cat.examples.length > 0) {
                      setSelectedExpression(cat.examples[0]);
                    }
                  }}
                  className={`p-3 rounded-2xl text-left flex items-center justify-between whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#FFE042] text-stone-950 font-bold shadow-xs'
                      : 'bg-white hover:bg-[#FAF6EC] text-stone-700 border border-stone-200/80'
                  }`}
                >
                  <span className="text-xs font-semibold">{cat.name}</span>
                  <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-stone-900/10 text-stone-900 font-bold' : 'text-stone-400'
                  }`}>
                    {getCategoryCount(cat)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Expressions in this Category */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              {activeSourceTab === 'catalog' ? `${activeCategory.name} Expressions` : `My Saved in ${activeCategory.name}`}
            </span>
            <span className="text-xs text-stone-400 font-mono">({displayedExpressions.length})</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter expressions..."
              className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            />
          </div>

          <div className="space-y-2">
            {displayedExpressions.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center space-y-2">
                <div className="text-xs text-stone-500">
                  {activeSourceTab === 'my-saved' 
                    ? `You haven't saved any custom expressions under "${activeCategory.name}" yet.`
                    : 'No expressions in this category.'}
                </div>
                {activeSourceTab === 'my-saved' && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="py-1.5 px-3 bg-[#FFE042] text-stone-900 text-xs font-bold rounded-xl"
                  >
                    + Add One Now
                  </button>
                )}
              </div>
            ) : (
              displayedExpressions.map((expr) => {
                const isSelected = selectedExpression.word === expr.word;
                return (
                  <div
                    key={expr.id || expr.word}
                    {...clickableProps(() => setSelectedExpression(expr))}
                    className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#FAF6EC] border-[#FFE042] ring-2 ring-[#FFE042]/60 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-stone-900 font-serif-display truncate">
                        {expr.word}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate mt-0.5">
                        {expr.meanings[0]?.definitions[0]?.definition}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
                      isSelected ? 'text-stone-950' : 'text-stone-300'
                    }`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Rhetorical Breakdown Card */}
        <div className="md:col-span-5">
          <div className="bg-[#FAF6EC] p-6 rounded-3xl border border-stone-200 space-y-5 shadow-xs sticky top-20">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold font-serif-display text-stone-950">
                  {selectedExpression.word}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="px-2.5 py-0.5 bg-[#FFE042] text-stone-950 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                    TRANSITION
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#F2ECE1] text-stone-800 rounded-lg text-xs font-semibold">
                    {activeCategory.name}
                  </span>
                  <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold">
                    {selectedExpression.nuance?.formality || 'Formal'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handlePlayAudio(selectedExpression.word)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                  isPlayingAudio ? 'bg-[#FFE042] scale-105 shadow-sm' : 'bg-white hover:bg-[#FFE042] border border-stone-200'
                }`}
                title="Hear pronunciation"
              >
                <Volume2 className="w-5 h-5 text-stone-900" />
              </button>
            </div>

            {/* Meaning */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Meaning
              </div>
              <p className="text-sm text-stone-800 leading-relaxed font-normal">
                {selectedExpression.meanings[0]?.definitions[0]?.definition}
              </p>
            </div>

            {/* Example */}
            {selectedExpression.meanings[0]?.definitions[0]?.example && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Example
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200 font-serif text-xs text-stone-800 leading-relaxed italic">
                  "{selectedExpression.meanings[0]?.definitions[0]?.example}"
                </div>
              </div>
            )}

            {/* Best used when / Avoid when */}
            <div className="space-y-3 pt-2 border-t border-stone-200/80">
              {selectedExpression.nuance?.bestUsedWhen && (
                <div>
                  <div className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Best used when</span>
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600 pl-4 list-disc">
                    {selectedExpression.nuance.bestUsedWhen.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedExpression.nuance?.avoidWhen && (
                <div>
                  <div className="text-xs font-bold text-rose-800 mb-1">
                    Avoid when:
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600 pl-4 list-disc">
                    {selectedExpression.nuance.avoidWhen.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Related expressions */}
            {selectedExpression.relatedExpressions && selectedExpression.relatedExpressions.length > 0 && (
              <div className="pt-2 border-t border-stone-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Related expressions
                </div>
                <div className="space-y-1.5">
                  {selectedExpression.relatedExpressions.map((rel) => (
                    <button
                      key={rel.phrase}
                      onClick={() => {
                        // Open the real entry: from the catalog if it's there,
                        // otherwise look it up. (This used to make up an entry
                        // reusing the previous expression's example and notes.)
                        const target = rel.phrase.toLowerCase();
                        for (const cat of TRANSITION_CATEGORIES) {
                          const match = cat.examples.find(e => e.word.toLowerCase() === target);
                          if (match) {
                            setSelectedCategoryId(cat.id);
                            setSelectedExpression(match);
                            return;
                          }
                        }
                        onSearchLookup?.(rel.phrase);
                      }}
                      className="w-full p-2.5 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs font-semibold text-stone-800 transition-colors"
                    >
                      <span>{rel.phrase}</span>
                      <span className="text-[11px] text-stone-400 capitalize">{rel.relation}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Speech-to-Text Pronunciation Practice Card */}
            <div className="pt-3 border-t border-stone-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Practise Speaking (Speech-to-Text)
                </span>
                {(practiceCheck || practiceError) && (
                  <button
                    type="button"
                    onClick={resetPractice}
                    className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={startPracticeSpeech}
                disabled={isPracticingSpeech}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isPracticingSpeech
                    ? 'bg-rose-500 text-white animate-pulse shadow-md'
                    : 'bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 shadow-2xs'
                }`}
              >
                {isPracticingSpeech ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-stone-700" />}
                <span>{isPracticingSpeech ? 'Listening... Speak transition now' : 'Practise Speaking & Check'}</span>
              </button>

              {/* What was heard, or why listening failed */}
              {!isPracticingSpeech && (
                <SpokenCheckResult target={selectedExpression.word} check={practiceCheck} error={practiceError} />
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
              <button
                onClick={() => handlePlayAudio(selectedExpression.word)}
                className="flex-1 py-3 px-4 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Hear it (UK)</span>
              </button>

              <button
                onClick={() => onOpenSaveModal(selectedExpression)}
                className="py-3 px-5 bg-white hover:bg-stone-50 text-stone-900 font-bold text-xs rounded-xl border border-stone-300 flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Expression Modal with Speech-to-Text Dictation & Prefix Cleaner */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Add Your Own Expression / Transition</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Type or speak your favorite rhetoric markers, transition phrases, or speaking formulas.
            </p>

            <form onSubmit={handleCreateCustom} className="space-y-3.5">
              {/* Phrase or Transition with Speech-to-Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Phrase or Transition</label>
                  <button
                    type="button"
                    onClick={() => startFieldDictation('phrase')}
                    disabled={isDictating}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isDictating && dictatingTarget === 'phrase'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-100 hover:bg-[#FFE042] text-stone-800'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isDictating && dictatingTarget === 'phrase' ? 'Listening...' : 'Speak phrase'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="e.g. As a matter of course, On the flip side..."
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                />
                {dictationError && (
                  <div role="alert" className="mt-1.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900">
                    {dictationError}
                  </div>
                )}
                {/* Live Speech Feedback & Automatic "the transition" Prefix Stripping */}
                {rawSpokenText && (
                  <div className="mt-1.5 p-2.5 bg-[#FAF6EC] border border-amber-200/70 rounded-xl text-[11px] text-stone-800 space-y-1 animate-in fade-in">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Heard: <span className="italic font-normal">"{rawSpokenText}"</span></span>
                      <button
                        type="button"
                        onClick={() => {
                          setRawSpokenText('');
                          setCleanedSpokenText('');
                        }}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {cleanedSpokenText && cleanedSpokenText.toLowerCase() !== rawSpokenText.toLowerCase() && (
                      <div className="text-[10px] text-emerald-800 font-medium">
                        Stripped prefix "the transition" &rarr; Cleaned as: <span className="font-bold underline">{cleanedSpokenText}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category / Purpose */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Category / Purpose</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                >
                  {TRANSITION_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Meaning / When to use with Speech-to-Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Meaning / When to use</label>
                  <button
                    type="button"
                    onClick={() => startFieldDictation('meaning')}
                    disabled={isDictating}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isDictating && dictatingTarget === 'meaning'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-100 hover:bg-[#FFE042] text-stone-800'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isDictating && dictatingTarget === 'meaning' ? 'Listening...' : 'Speak meaning'}</span>
                  </button>
                </div>
                <textarea
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="Used to connect..."
                  rows={2}
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                />
              </div>

              {/* Example Sentence with Speech-to-Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Example Sentence</label>
                  <button
                    type="button"
                    onClick={() => startFieldDictation('example')}
                    disabled={isDictating}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isDictating && dictatingTarget === 'example'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-100 hover:bg-[#FFE042] text-stone-800'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isDictating && dictatingTarget === 'example' ? 'Listening...' : 'Speak example'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="e.g. On the flip side, we must anticipate..."
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 font-bold rounded-xl text-xs shadow-2xs"
                >
                  Save to My Expressions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
