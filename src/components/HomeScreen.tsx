import React, { useState } from 'react';
import { WordEntry, Collection } from '../types';
import { 
  Search, Mic, Camera, FileText, Quote, ChevronRight, 
  Volume2, ArrowRight, BookOpen, Sparkles, Loader2,
  BookMarked, Headphones, Bookmark
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { SayNestBird } from './SayNestBird';
import { BookCover } from './BookCover';
import { VoiceSearchModal } from './VoiceSearchModal';

interface HomeScreenProps {
  recentWords: WordEntry[];
  collections: Collection[];
  onSearchLookup: (query: string) => void;
  onSelectWord: (word: WordEntry) => void;
  onOpenScanPage: () => void;
  onOpenPasteText: () => void;
  onOpenAddQuote: () => void;
  onOpenReview: () => void;
  onOpenCollections: (collectionId?: string) => void;
  onOpenLibrary: () => void;
  onOpenBookSearch: () => void;
  onOpenExpressions?: () => void;
  onOpenCommuteMode?: () => void;
  isLoadingLookup?: boolean;
  reviewDueCount: number;
  reviewMinutes: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  recentWords,
  collections,
  onSearchLookup,
  onSelectWord,
  onOpenScanPage,
  onOpenPasteText,
  onOpenAddQuote,
  onOpenReview,
  onOpenCollections,
  onOpenLibrary,
  onOpenBookSearch,
  onOpenExpressions,
  onOpenCommuteMode,
  isLoadingLookup = false,
  reviewDueCount,
  reviewMinutes
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeAudioWordId, setActiveAudioWordId] = useState<string | null>(null);

  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchLookup(searchInput.trim());
    }
  };

  const handleQuickVoice = () => {
    setIsVoiceModalOpen(true);
  };

  const handlePlayWord = (e: React.MouseEvent, word: WordEntry) => {
    e.stopPropagation();
    setActiveAudioWordId(word.id);
    speakWord(
      word.word,
      'British',
      1.0,
      word.accents[0]?.audioUrl,
      () => setActiveAudioWordId(word.id),
      () => setActiveAudioWordId(null)
    );
  };

  const activeBook = collections[0];
  // Real numbers for the "Currently reading" card
  const activeBookSaved = activeBook ? recentWords.filter((w) => w.collectionId === activeBook.id).length : 0;
  const activeBookProgress =
    activeBook?.totalChapters && activeBook.currentChapter
      ? Math.min(100, Math.round((activeBook.currentChapter / activeBook.totalChapters) * 100))
      : null;

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-20">
      {/* Hero Header matching Mockup Screen 1, responsive on both mobile and wide screens */}
      <div className="bg-[#FFE042] px-4 sm:px-8 pt-5 pb-7 rounded-b-[32px] sm:rounded-b-[40px] relative overflow-hidden shadow-xs">
        <div className="max-w-6xl mx-auto w-full relative z-10">
          {/* Mobile-only brand bar (on desktop, HeaderNav handles this) */}
          <div className="flex md:hidden items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SayNestBird variant="nest" size={32} />
              <span className="font-extrabold text-xl tracking-tight text-stone-950 font-serif-display">
                SayNest
              </span>
            </div>

          </div>

          {/* Hero Title & Authentic Chick Illustration */}
          <div className="flex items-start justify-between mb-5">
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-4xl font-extrabold font-serif-display text-stone-950 tracking-tight leading-tight">
                What did you discover today?
              </h1>
              <p className="text-xs sm:text-base text-stone-800 font-medium mt-1.5 leading-relaxed">
                Look up a word, phrase or expression. Save it. Revisit it. Use it.
              </p>
            </div>

            <div className="shrink-0 -mt-2 -mr-1 sm:mr-4">
              <SayNestBird variant="reading" size={88} />
            </div>
          </div>

          {/* Big Search Input with Mic Trigger */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-stone-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Type or say a word, phrase, or expression..."
                className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white rounded-2xl text-sm sm:text-base font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-sm"
              />
              <button
                type="button"
                onClick={handleQuickVoice}
                className={`w-10 h-10 rounded-xl absolute right-2 flex items-center justify-center transition-colors ${
                  isVoiceModalOpen ? 'bg-[#FFE042] text-stone-950 scale-105' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Voice input"
              >
                {isLoadingLookup ? (
                  <Loader2 className="w-5 h-5 animate-spin text-stone-900" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          {/* 4 Quick Action Buttons matching mockup Screen 1 */}
          <div className="grid grid-cols-4 sm:grid-cols-4 max-w-2xl gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onOpenScanPage}
              className="p-2.5 sm:p-3 bg-white/90 hover:bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] flex items-center justify-center group-hover:bg-[#FFE042] transition-colors">
                <Camera className="w-4 h-4 text-stone-800" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-stone-900 whitespace-nowrap">Scan a page</span>
            </button>

            <button
              type="button"
              onClick={onOpenPasteText}
              className="p-2.5 sm:p-3 bg-white/90 hover:bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] flex items-center justify-center group-hover:bg-[#FFE042] transition-colors">
                <FileText className="w-4 h-4 text-stone-800" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-stone-900 whitespace-nowrap">Paste text</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddQuote}
              className="p-2.5 sm:p-3 bg-white/90 hover:bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] flex items-center justify-center group-hover:bg-[#FFE042] transition-colors">
                <Quote className="w-4 h-4 text-stone-800" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-stone-900 whitespace-nowrap">Add a quote</span>
            </button>

            <button
              type="button"
              onClick={handleQuickVoice}
              className="p-2.5 sm:p-3 bg-white/90 hover:bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] flex items-center justify-center group-hover:bg-[#FFE042] transition-colors">
                <Mic className="w-4 h-4 text-stone-800" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-stone-900 whitespace-nowrap">Speak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Responsive 2-column on desktop, single column on mobile */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (7 of 12 on desktop): Recently Discovered + Currently Reading */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Recently Discovered Section matching Mockup Screen 1 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif-display">
                  Recently saved
                </h2>
                {recentWords.length > 0 && (
                  <button
                    onClick={onOpenLibrary}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
                  >
                    See all ({recentWords.length})
                  </button>
                )}
              </div>

              {recentWords.length === 0 && (
                <div className="p-5 bg-white rounded-2xl border border-dashed border-stone-300 text-center text-xs text-stone-500">
                  Words you save will appear here. Look one up above to get started.
                </div>
              )}

              <div className="space-y-2.5">
                {recentWords.slice(0, 5).map((word) => (
                  <div
                    key={word.id}
                    onClick={() => onSelectWord(word)}
                    className="p-4 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#FAF6EC] flex items-center justify-center shrink-0 text-stone-700 font-serif font-bold text-sm">
                        {word.word.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-base text-stone-900 font-serif-display truncate">
                          {word.word}
                        </div>
                        <div className="text-xs text-stone-500 capitalize flex items-center gap-1.5 mt-0.5">
                          <span>{word.meanings[0]?.partOfSpeech || word.type}</span>
                          <span>·</span>
                          <span>{word.meanings.length > 1 ? `${word.meanings.length} meanings` : '1 meaning'}</span>
                          {word.phonetic && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-stone-400 text-[11px]">{word.phonetic}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handlePlayWord(e, word)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                          activeAudioWordId === word.id ? 'bg-[#FFE042]' : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
                        }`}
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currently Reading Book Card matching Mockup image_76d49435.png */}
            {activeBook && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif-display">
                    Currently reading
                  </h2>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBookSearch();
                    }}
                    className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1.5 py-1 px-3 rounded-xl bg-[#FAF6EC] hover:bg-[#FFE042] transition-colors"
                    title="Search and attach any book cover online"
                  >
                    <Search className="w-3 h-3 text-stone-500" />
                    <span>Change / Add Book</span>
                  </button>
                </div>

                <div
                  onClick={() => onOpenCollections(activeBook.id)}
                  className="p-5 bg-white hover:bg-stone-50/80 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Illustrated Book Jacket matching ref image */}
                    <BookCover
                      collectionId={activeBook.id}
                      title={activeBook.title}
                      author={activeBook.author}
                      coverImage={activeBook.coverImage}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg text-stone-950 font-serif-display truncate">
                        {activeBook.title}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">{activeBook.author}</div>
                      <div className="text-xs text-stone-500 mt-2 flex items-center gap-1.5 font-medium">
                        <Bookmark className="w-3 h-3 text-stone-400" />
                        <span>
                          {activeBookSaved} {activeBookSaved === 1 ? 'discovery' : 'discoveries'} saved
                        </span>
                      </div>
                      {/* Reading progress, from the chapter you're on */}
                      {activeBookProgress !== null && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="w-full max-w-[220px] bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#FFE042] h-full rounded-full" style={{ width: `${activeBookProgress}%` }} />
                          </div>
                          <span className="text-[10px] text-stone-400 font-semibold shrink-0">
                            Ch. {activeBook.currentChapter}/{activeBook.totalChapters}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-800 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 of 12 on desktop): Continue Learning + Expressions + Commute */}
          <div className="md:col-span-5 space-y-5">
            
            {/* Continue Learning Banner matching Mockup */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span className="text-sm sm:text-base font-bold text-stone-900">Continue learning</span>
                </div>
                <div className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                  {reviewDueCount > 0 ? (
                    <>
                      {reviewDueCount} {reviewDueCount === 1 ? 'word' : 'words'} due for review <br />
                      <span className="text-stone-400">⏱ ~ {reviewMinutes} {reviewMinutes === 1 ? 'minute' : 'minutes'}</span>
                    </>
                  ) : (
                    <>All caught up for now. Nice work!</>
                  )}
                </div>
                <button
                  onClick={onOpenReview}
                  className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                >
                  <span>{reviewDueCount > 0 ? 'Start review' : 'Practise anyway'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="shrink-0 -mr-1">
                <SayNestBird variant="tiptoe" size={76} />
              </div>
            </div>

            {/* Expressions & Transitions Spotlight Card */}
            {onOpenExpressions && (
              <div 
                onClick={onOpenExpressions}
                className="bg-white hover:bg-stone-50/90 p-5 rounded-3xl border border-stone-200/90 shadow-xs cursor-pointer transition-all group flex items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFE042] text-stone-950 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                      Rhetoric
                    </span>
                    <span className="text-xs font-bold text-stone-900">Expressions & Transitions</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Master 9 rhetorical connector categories (`By the same token`, `Notwithstanding`) for clear writing and speech.
                  </p>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1 group-hover:text-amber-700 transition-colors">
                    <span>Explore Expressions</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="shrink-0">
                  <SayNestBird variant="flag" size={60} />
                </div>
              </div>
            )}

            {/* Commute Audio Mode Feature Card */}
            {onOpenCommuteMode && (
              <div 
                onClick={onOpenCommuteMode}
                className="bg-[#FFE042]/20 hover:bg-[#FFE042]/30 border border-[#FFE042]/60 p-5 rounded-3xl shadow-xs cursor-pointer transition-all group flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-stone-900" />
                    <span className="text-xs sm:text-sm font-bold text-stone-900">Hands-free Commute Audio</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Listen to words, pronunciations, meanings, and examples aloud on your walk or subway.
                  </p>
                </div>

                <div className="shrink-0">
                  <SayNestBird variant="headphones" size={56} />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Voice Lookup Modal */}
      {isVoiceModalOpen && (
        <VoiceSearchModal
          onClose={() => setIsVoiceModalOpen(false)}
          onSearch={(spokenWord) => {
            setSearchInput(spokenWord);
            onSearchLookup(spokenWord);
          }}
        />
      )}
    </div>
  );
};
