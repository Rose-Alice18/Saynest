import React, { useState } from 'react';
import { WordEntry, AccentType } from '../types';
import { 
  ArrowLeft, Bookmark, MoreVertical, Volume2, 
  Headphones, ChevronRight, Check, Share2, Sparkles, Plus, Star, Search
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { clickableProps } from '../utils/a11y';
import { SayNestBird } from './SayNestBird';

interface WordDetailScreenProps {
  word: WordEntry;
  onBack: () => void;
  onOpenSaveModal: (word: WordEntry) => void;
  onOpenPractice: (word: WordEntry) => void;
  onToggleStar: (wordId: string) => void;
  /** Remove this word from the saved library (it stays in Search History) */
  onUnsave?: () => void;
  onSearchLookup?: (word: string) => void;
  isSaved?: boolean;
  /** True while AI details are still loading for this word */
  isEnhancing?: boolean;
}

export const WordDetailScreen: React.FC<WordDetailScreenProps> = ({
  word,
  onBack,
  onOpenSaveModal,
  onOpenPractice,
  onToggleStar,
  onUnsave,
  onSearchLookup,
  isSaved = false,
  isEnhancing = false
}) => {
  const [selectedAccent, setSelectedAccent] = useState<AccentType>('British');
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<string | null>(
    word.meanings[0]?.partOfSpeech || null
  );
  const [activeSubTab, setActiveSubTab] = useState<'Meaning' | 'Pronunciation' | 'Examples' | 'Related'>('Meaning');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [accentDropdownOpen, setAccentDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchAnotherText, setSearchAnotherText] = useState('');

  // Scroll to top on load or word change
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [word.id]);

  // When AI details arrive, the parts of speech can change (e.g. 'word' becomes
  // 'adverb'). If the selected one no longer exists, show all meanings.
  React.useEffect(() => {
    setSelectedPartOfSpeech((current) =>
      current && word.meanings.some((m) => m.partOfSpeech.toLowerCase() === current.toLowerCase())
        ? current
        : word.meanings[0]?.partOfSpeech || null
    );
  }, [word.meanings]);

  const activeAccentInfo = word.accents.find(a => a.accent === selectedAccent) || word.accents[0];

  const handlePlayAudio = (accent: AccentType = selectedAccent) => {
    const acc = word.accents.find(a => a.accent === accent) || word.accents[0];
    setIsPlayingAudio(true);
    speakWord(
      word.word,
      accent,
      1.0,
      acc?.audioUrl,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${word.word} (${word.phonetic}) - ${word.meanings[0]?.definitions[0]?.definition}`);
      showToast('Copied word details to clipboard!');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-28">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#FFFDF7]/95 backdrop-blur-md border-b border-stone-200/60">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleStar(word.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              word.isStarred ? 'text-amber-500 bg-amber-50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
            aria-label="Star word"
          >
            <Star className={`w-5 h-5 ${word.isStarred ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => (isSaved && onUnsave ? onUnsave() : onOpenSaveModal(word))}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isSaved ? 'text-amber-600 bg-amber-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            aria-label={isSaved ? 'Unsave' : 'Save'}
            title={isSaved ? 'Remove from saved library' : 'Save to library'}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#FFE042]' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Continuous Search Bar: lookup another word effortlessly */}
      {onSearchLookup && (
        <div className="px-5 pt-3 pb-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchAnotherText.trim()) {
                onSearchLookup(searchAnotherText.trim());
                setSearchAnotherText('');
              }
            }}
            className="relative flex items-center"
          >
            <Search className="w-3.5 h-3.5 absolute left-3.5 text-stone-400" />
            <input
              type="text"
              value={searchAnotherText}
              onChange={(e) => setSearchAnotherText(e.target.value)}
              placeholder="Search another word or phrase..."
              className="w-full pl-9 pr-18 py-2 bg-[#FAF6EC] hover:bg-[#F5EEDC] focus:bg-white rounded-xl text-xs font-medium text-stone-900 placeholder-stone-400 border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-[#FFE042] transition-colors"
            />
            {searchAnotherText.trim() && (
              <button
                type="submit"
                className="absolute right-1.5 py-1 px-2.5 bg-stone-950 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95"
              >
                Lookup
              </button>
            )}
          </form>
        </div>
      )}

      {/* Main Word Header */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold font-serif-display text-stone-950 tracking-tight">
                {word.word}
              </h1>
              <button
                onClick={() => handlePlayAudio(selectedAccent)}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 ${
                  isPlayingAudio ? 'bg-[#FFE042] scale-105 shadow-md' : 'bg-[#FFE042] hover:bg-[#F7D836]'
                }`}
                aria-label="Play pronunciation"
              >
                <Volume2 className="w-5 h-5 text-stone-900" />
              </button>
            </div>

            {isEnhancing && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800"
                role="status"
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                Adding AI insights…
              </div>
            )}

            {/* Phonetic & Accent Dropdown */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-stone-600 text-sm">
              <span className="font-mono text-base font-medium text-stone-800">
                {activeAccentInfo?.ipa || word.phonetic}
              </span>

              {/* Accent Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccentDropdownOpen(!accentDropdownOpen)}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-xs font-semibold text-stone-800 transition-colors"
                >
                  <span>{activeAccentInfo?.flag || '🇬🇧'}</span>
                  <span>{selectedAccent} English</span>
                  <span className="text-[10px] text-stone-400">▼</span>
                </button>

                {accentDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-30 animate-in fade-in">
                    {(['British', 'American', 'Australian'] as AccentType[]).map((acc) => {
                      const flag = acc === 'British' ? '🇬🇧' : acc === 'American' ? '🇺🇸' : '🇦🇺';
                      return (
                        <button
                          key={acc}
                          onClick={() => {
                            setSelectedAccent(acc);
                            setAccentDropdownOpen(false);
                            handlePlayAudio(acc);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-stone-50 ${
                            selectedAccent === acc ? 'font-bold text-stone-950 bg-stone-50' : 'text-stone-600'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{flag}</span>
                            <span>{acc} English</span>
                          </span>
                          {selectedAccent === acc && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Syllable Breakdown */}
            {word.syllables && (
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                {word.syllables}
              </div>
            )}

            {/* Part of Speech Toggle Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {word.meanings.map((m) => {
                const isSelected = selectedPartOfSpeech?.toLowerCase() === m.partOfSpeech.toLowerCase();
                return (
                  <button
                    key={m.partOfSpeech}
                    type="button"
                    onClick={() => {
                      if (selectedPartOfSpeech?.toLowerCase() === m.partOfSpeech.toLowerCase()) {
                        setSelectedPartOfSpeech(null); // show all
                      } else {
                        setSelectedPartOfSpeech(m.partOfSpeech);
                      }
                      setActiveSubTab('Meaning');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFE042] text-stone-950 shadow-xs ring-2 ring-[#FFE042]/70 font-black'
                        : 'bg-[#F2ECE1] hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {m.partOfSpeech}
                  </button>
                );
              })}
              {word.meanings.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedPartOfSpeech(null)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedPartOfSpeech === null
                      ? 'bg-stone-900 text-white font-bold'
                      : 'text-stone-500 hover:text-stone-900 bg-stone-100'
                  }`}
                >
                  All ({word.meanings.length})
                </button>
              )}
              {word.nuance?.cefr && (
                <span className="px-2.5 py-1 bg-amber-100/70 text-amber-800 rounded-lg text-xs font-bold">
                  {word.nuance.cefr}
                </span>
              )}
            </div>
          </div>

          {/* Cute SayNest bird character matching mockup */}
          <div className="shrink-0 -mt-1 -mr-1">
            <SayNestBird variant="heart" size={68} />
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Meaning, Pronunciation, Examples, Related */}
      <div className="px-4 sm:px-6 border-b border-stone-200/70">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-8 overflow-x-auto no-scrollbar text-xs sm:text-sm font-semibold">
          {(['Meaning', 'Pronunciation', 'Examples', 'Related'] as const).map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`py-3 px-2 sm:px-1 relative transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-6 space-y-6">
        {activeSubTab === 'Meaning' && (
          <div className="space-y-6">
            {(selectedPartOfSpeech
              ? word.meanings.filter(m => m.partOfSpeech.toLowerCase() === selectedPartOfSpeech.toLowerCase())
              : word.meanings
            ).map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <div className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFE042] text-stone-950 rounded-md text-[11px] font-black uppercase">
                      {group.partOfSpeech}
                    </span>
                    <span className="text-xs text-stone-500 font-normal">
                      ({group.definitions.length} {group.definitions.length === 1 ? 'definition' : 'definitions'})
                    </span>
                  </div>
                  <span className="h-px flex-1 bg-stone-200/80"></span>
                </div>

                <div className="space-y-4">
                  {group.definitions.map((def, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-3">
                      <span className="font-bold text-stone-400 text-sm mt-0.5">{dIdx + 1}.</span>
                      <div className="flex-1 space-y-2">
                        <p className="text-stone-800 text-sm leading-relaxed font-normal">
                          {def.definition}
                        </p>
                        {def.example && (
                          <div className="p-3 bg-[#FAF6EC] rounded-xl border border-stone-200/70 text-xs font-serif text-stone-700 italic">
                            <span className="font-sans font-bold text-stone-400 not-italic mr-1.5">&gt;</span>
                            {def.example}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Nuance Guide Box if available */}
            {word.nuance && (
              <div className="bg-[#FAF6EC] p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Usage Nuance & Precision
                </div>
                {word.nuance.bestUsedWhen && (
                  <div>
                    <div className="text-xs font-semibold text-emerald-800 mb-1">Best used when:</div>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                      {word.nuance.bestUsedWhen.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {word.nuance.avoidWhen && (
                  <div>
                    <div className="text-xs font-semibold text-rose-800 mb-1">Avoid when:</div>
                    <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                      {word.nuance.avoidWhen.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'Pronunciation' && (
          <div className="space-y-4">
            <div className="bg-[#FAF6EC] p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Accent Comparison
              </div>

              <div className="space-y-3">
                {(['British', 'American', 'Australian'] as AccentType[]).map((acc) => {
                  const info = word.accents.find(a => a.accent === acc) || {
                    accent: acc,
                    ipa: word.phonetic,
                    flag: acc === 'British' ? '🇬🇧' : acc === 'American' ? '🇺🇸' : '🇦🇺'
                  };
                  return (
                    <div
                      key={acc}
                      className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{info.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-stone-900">{acc} English</div>
                          <div className="font-mono text-xs text-stone-600">{info.ipa}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlayAudio(acc)}
                        className="py-1.5 px-3 bg-[#FFE042] hover:bg-[#F7D836] rounded-lg text-xs font-semibold text-stone-900 flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'Examples' && (
          <div className="space-y-3">
            {word.meanings.flatMap(m => m.definitions).filter(d => d.example).map((def, i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-stone-200 font-serif text-sm text-stone-800 leading-relaxed italic">
                "{def.example}"
              </div>
            ))}
            {!word.meanings.some(m => m.definitions.some(d => d.example)) && (
              <div className="p-5 text-center text-xs text-stone-500 bg-white rounded-xl border border-dashed border-stone-300">
                {isEnhancing ? 'Example sentences are on their way…' : 'No example sentences for this one yet.'}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'Related' && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
              Related synonyms, variants & rhetorical expressions
            </div>
            {/* Previously this fell back to a fixed list of synonyms for "mimic",
                which showed up as "related" to every word without its own list */}
            {!word.relatedExpressions?.length && (
              <div className="p-5 text-center text-xs text-stone-500 bg-white rounded-xl border border-dashed border-stone-300">
                {isEnhancing ? 'Finding related words and expressions…' : 'No related expressions for this one yet.'}
              </div>
            )}
            {(word.relatedExpressions || []).map((rel, i) => (
              <div
                key={i}
                {...clickableProps(() => onSearchLookup?.(rel.phrase))}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(rel.phrase, selectedAccent, 1.0);
                    }}
                    className="w-8 h-8 rounded-full bg-[#FAF6EC] hover:bg-[#FFE042] flex items-center justify-center text-stone-800 transition-colors shrink-0"
                    title={`Pronounce ${rel.phrase}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <div>
                    <div className="text-sm font-bold text-stone-900 font-serif-display group-hover:text-amber-950 flex items-center gap-1.5">
                      <span>{rel.phrase}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-700 transition-colors" />
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">{rel.relation}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-lg capitalize shrink-0">
                  {rel.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Practise Pronunciation Card (Matching Mockup exactly!) */}
        <div 
          {...clickableProps(() => onOpenPractice(word))}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 bg-[#FAF6EC] hover:bg-[#F5EEDC] cursor-pointer p-4 rounded-2xl border border-stone-200 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FFE042] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-stone-900" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">Practise pronunciation</div>
              <div className="text-xs text-stone-500 mt-0.5">Hear it, record yourself and get feedback</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
        </div>
      </div>

      {/* Sticky Bottom Actions Bar matching mockup */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-[#FFFDF7]/95 backdrop-blur-md border-t border-stone-200/80 z-30 flex items-center gap-3">
        <button
          onClick={() => onOpenSaveModal(word)}
          className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] ${
            isSaved
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              : 'bg-stone-900 hover:bg-stone-800 text-white'
          }`}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4 fill-white" />}
          <span>{isSaved ? 'Saved · Edit' : 'Save to library'}</span>
        </button>

        <button
          onClick={() => onOpenSaveModal(word)}
          className="py-3 px-4 bg-white hover:bg-stone-50 text-stone-900 font-semibold text-sm rounded-xl border border-stone-300 flex items-center gap-2 transition-transform active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add note</span>
        </button>
      </div>

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 py-2 px-4 bg-stone-900 text-white rounded-full text-xs font-semibold shadow-lg animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
