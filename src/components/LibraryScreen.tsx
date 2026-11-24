import React, { useState } from 'react';
import { WordEntry } from '../types';
import { 
  Search, Volume2, Star, MoreVertical, SlidersHorizontal, 
  BookOpen, Quote, Sparkles, Bookmark, History, Plus, Check, Clock, Trash2, Download, X
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { clickableProps } from '../utils/a11y';
import { SayNestBird } from './SayNestBird';
import { ExportModal } from './ExportModal';
import { dateGroup } from '../utils/review';

interface LibraryScreenProps {
  words: WordEntry[];
  searchHistory?: WordEntry[];
  /** Which list is showing; kept by the parent so other screens can pick it */
  activeView: 'saved' | 'history';
  onChangeView: (view: 'saved' | 'history') => void;
  onSelectWord: (word: WordEntry) => void;
  onToggleStar: (wordId: string) => void;
  onDeleteWord: (wordId: string) => void;
  onSaveFromHistory?: (word: WordEntry) => void;
  onClearHistory?: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  words,
  searchHistory = [],
  activeView,
  onChangeView: setActiveView,
  onSelectWord,
  onToggleStar,
  onDeleteWord,
  onSaveFromHistory,
  onClearHistory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Starred' | 'Words' | 'Phrases' | 'Transitions' | 'Quotes'>('All');
  const [activeAudioWordId, setActiveAudioWordId] = useState<string | null>(null);
  const [historySort, setHistorySort] = useState<'recent' | 'az' | 'za'>('recent');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  // Filter Saved Words
  const filteredSavedWords = words.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meanings.some(m => m.definitions.some(d => d.definition.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (w.userNote && w.userNote.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'All') return true;
    if (filterType === 'Starred') return !!w.isStarred;
    if (filterType === 'Words') return w.type === 'word';
    if (filterType === 'Phrases') return w.type === 'phrase';
    if (filterType === 'Transitions') return w.type === 'transition';
    if (filterType === 'Quotes') return w.type === 'quote';
    return true;
  });

  // Filter Search History
  const filteredHistory = searchHistory.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.word.toLowerCase().includes(query) ||
      item.meanings.some(m => m.definitions.some(d => d.definition.toLowerCase().includes(query)))
    );
  });

  // Sort Search History (Recent, A–Z, Z–A)
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (historySort === 'az') {
      return a.word.localeCompare(b.word);
    }
    if (historySort === 'za') {
      return b.word.localeCompare(a.word);
    }
    const timeA = new Date(a.searchedAt || a.dateAdded || 0).getTime();
    const timeB = new Date(b.searchedAt || b.dateAdded || 0).getTime();
    return timeB - timeA;
  });

  // Group Saved words by Today, Yesterday, Earlier, worked out from when each
  // was added (a stored label would say "Today" forever)
  const todayWords = filteredSavedWords.filter(w => dateGroup(w.dateAdded) === 'Today');
  const yesterdayWords = filteredSavedWords.filter(w => dateGroup(w.dateAdded) === 'Yesterday');
  const earlierWords = filteredSavedWords.filter(w => dateGroup(w.dateAdded) === 'Earlier');

  const formatSearchTime = (dateStr?: string) => {
    if (!dateStr) return 'Searched recently';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just searched';
      if (diffMins < 60) return `Searched ${diffMins}m ago`;
      if (diffMins < 1440) return `Searched ${Math.floor(diffMins / 60)}h ago`;
      return `Searched on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } catch {
      return 'Searched';
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-36 md:pb-28">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-[#FFFDF7]/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-stone-200/60 space-y-3">
        {/* Top Segmented Mode: Search History first, then Saved Library */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-2xl max-w-md mx-auto w-full">
          <button
            onClick={() => setActiveView('history')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'history'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-stone-700" />
            <span>Search History ({searchHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveView('saved')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'saved'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-700" />
            <span>Saved Library ({words.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeView === 'saved' ? "Search your library..." : "Filter your lookup history..."}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6EC] rounded-2xl text-xs sm:text-sm font-medium text-stone-900 placeholder-stone-400 border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            />
          </div>

          {activeView === 'saved' && (
            <button
              onClick={() => {
                const cycle: ('All' | 'Starred' | 'Words' | 'Phrases' | 'Transitions' | 'Quotes')[] = ['All', 'Starred', 'Words', 'Phrases', 'Transitions', 'Quotes'];
                const nextIndex = (cycle.indexOf(filterType) + 1) % cycle.length;
                setFilterType(cycle[nextIndex]);
              }}
              className="w-10 h-10 rounded-2xl bg-[#FAF6EC] border border-stone-200/80 flex items-center justify-center text-stone-700 hover:text-stone-950 transition-colors"
              title="Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills for Saved Library + Export Button */}
        {activeView === 'saved' && (
          <div className="flex items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(['All', 'Starred', 'Words', 'Phrases', 'Transitions', 'Quotes'] as const).map((tab) => {
                const isActive = filterType === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-[#FAF6EC] text-stone-600 hover:bg-stone-200/60'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="py-1.5 px-3 rounded-full text-xs font-semibold bg-[#FAF6EC] hover:bg-[#FFE042] text-stone-800 border border-stone-200/80 flex items-center gap-1 shrink-0 transition-all shadow-2xs"
              title="Export to Anki deck or print flashcards"
            >
              <Download className="w-3.5 h-3.5 text-stone-700" />
              <span className="hidden sm:inline">Export / Print</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        )}

        {/* Header Bar for Search History with Sorting + Export */}
        {activeView === 'history' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1 text-xs text-stone-600">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sort:</span>
              <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHistorySort('recent')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    historySort === 'recent'
                      ? 'bg-white text-stone-950 font-bold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Most Recent
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySort('az')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    historySort === 'az'
                      ? 'bg-white text-stone-950 font-bold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  A–Z
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySort('za')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    historySort === 'za'
                      ? 'bg-white text-stone-950 font-bold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Z–A
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="py-1 px-2.5 rounded-xl text-xs font-semibold bg-[#FAF6EC] hover:bg-[#FFE042] text-stone-800 border border-stone-200/80 transition-colors flex items-center gap-1 shadow-2xs"
                title="Export search history to Anki or print"
              >
                <Download className="w-3 h-3 text-stone-700" />
                <span>Export</span>
              </button>
              <span className="text-[11px] text-stone-400 font-mono">({sortedHistory.length} words)</span>
              {searchHistory.length > 0 && onClearHistory && (
                <button
                  onClick={onClearHistory}
                  className="text-stone-500 hover:text-rose-600 font-semibold transition-colors flex items-center gap-1 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-6">
        {/* VIEW 1: SAVED LIBRARY */}
        {activeView === 'saved' && (
          <>
            {filteredSavedWords.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                <SayNestBird variant="nest" size={72} />
                <div className="text-base font-bold text-stone-800 font-serif-display">No saved words found</div>
                <div className="text-xs text-stone-500 leading-relaxed">
                  Deleted words are still saved in your <strong>Search History</strong> tab so you never lose any searched item.
                </div>
                <button
                  onClick={() => setActiveView('history')}
                  className="py-2 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
                >
                  View Search History ({searchHistory.length})
                </button>
              </div>
            ) : (
              <>
                {todayWords.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Today</div>
                    <div className="space-y-2.5">
                      {todayWords.map((item) => (
                        <WordCard
                          key={item.id}
                          item={item}
                          isPlayingAudio={activeAudioWordId === item.id}
                          onPlay={(e) => handlePlayWord(e, item)}
                          onSelect={() => onSelectWord(item)}
                          onToggleStar={() => onToggleStar(item.id)}
                          onDelete={() => onDeleteWord(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {yesterdayWords.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Yesterday</div>
                    <div className="space-y-2.5">
                      {yesterdayWords.map((item) => (
                        <WordCard
                          key={item.id}
                          item={item}
                          isPlayingAudio={activeAudioWordId === item.id}
                          onPlay={(e) => handlePlayWord(e, item)}
                          onSelect={() => onSelectWord(item)}
                          onToggleStar={() => onToggleStar(item.id)}
                          onDelete={() => onDeleteWord(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {earlierWords.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Earlier</div>
                    <div className="space-y-2.5">
                      {earlierWords.map((item) => (
                        <WordCard
                          key={item.id}
                          item={item}
                          isPlayingAudio={activeAudioWordId === item.id}
                          onPlay={(e) => handlePlayWord(e, item)}
                          onSelect={() => onSelectWord(item)}
                          onToggleStar={() => onToggleStar(item.id)}
                          onDelete={() => onDeleteWord(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* VIEW 2: SEARCH HISTORY ARCHIVE */}
        {activeView === 'history' && (
          <div className="space-y-3">
            {sortedHistory.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                <SayNestBird variant="nest" size={72} />
                <div className="text-base font-bold text-stone-800 font-serif-display">No search history yet</div>
                <div className="text-xs text-stone-500">
                  Every query you enter, speak, or scan will be kept here permanently even if deleted from the library.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedHistory.map((item) => {
                  const savedEntry = words.find(w => w.word.toLowerCase() === item.word.toLowerCase());
                  const primaryDef = item.meanings[0]?.definitions[0]?.definition || '';
                  const partOfSpeech = item.meanings[0]?.partOfSpeech || item.type;

                  return (
                    <div
                      key={item.id}
                      {...clickableProps(() => onSelectWord(item))}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 p-4 bg-white hover:bg-stone-50/80 rounded-2xl border border-stone-200/80 shadow-xs cursor-pointer transition-all hover:border-stone-300 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={(e) => handlePlayWord(e, item)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                            activeAudioWordId === item.id ? 'bg-[#FFE042] scale-105 shadow-sm' : 'bg-[#FAF6EC] hover:bg-[#FFE042]'
                          }`}
                          title="Hear pronunciation"
                        >
                          <Volume2 className="w-4 h-4 text-stone-900" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-base text-stone-900 truncate font-serif-display">
                              {item.word}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                            <span className="capitalize">{partOfSpeech}</span>
                            {item.phonetic && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-stone-600">{item.phonetic}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="text-[11px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatSearchTime(item.searchedAt || item.dateAdded)}
                            </span>
                          </div>

                          <p className="text-xs text-stone-700 mt-2 line-clamp-2 leading-relaxed">
                            {item.type === 'quote' ? item.word : primaryDef}
                          </p>
                        </div>
                      </div>

                      {/* Right Action: Saved Badge or Add to Library */}
                      <div className="flex items-center gap-2 shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
                        {savedEntry ? (
                          // Tap again to unsave; the word stays in Search History
                          <button
                            onClick={() => onDeleteWord(savedEntry.id)}
                            className="group/saved py-1 px-2.5 rounded-full bg-emerald-50 hover:bg-rose-50 text-emerald-800 hover:text-rose-800 text-[11px] font-semibold border border-emerald-200/80 hover:border-rose-200 flex items-center gap-1 transition-colors"
                            aria-label={`Unsave ${item.word}`}
                            title="Tap to remove from saved (you can undo)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Saved</span>
                            <X className="w-3 h-3 opacity-70" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onSaveFromHistory?.(item)}
                            className="py-1.5 px-3 rounded-xl bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                            title="Add back to saved library"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Deck Modal */}
      {isExportModalOpen && (
        <ExportModal
          title={activeView === 'saved' ? `Saved Library (${filteredSavedWords.length})` : `Search History (${sortedHistory.length})`}
          words={activeView === 'saved' ? filteredSavedWords : sortedHistory}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

interface WordCardProps {
  item: WordEntry;
  isPlayingAudio: boolean;
  onPlay: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
}

const WordCard: React.FC<WordCardProps> = ({
  item,
  isPlayingAudio,
  onPlay,
  onSelect,
  onToggleStar,
  onDelete
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryDef = item.meanings[0]?.definitions[0]?.definition || '';
  const partOfSpeech = item.meanings[0]?.partOfSpeech || 'word';

  return (
    <div
      {...clickableProps(onSelect)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 p-4 bg-white hover:bg-stone-50/80 rounded-2xl border border-stone-200/80 shadow-xs cursor-pointer transition-all hover:border-stone-300 relative group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Side: Audio Button + Title & Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            onClick={onPlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
              isPlayingAudio ? 'bg-[#FFE042] scale-105 shadow-sm' : 'bg-[#FAF6EC] hover:bg-[#FFE042]'
            }`}
            title="Hear pronunciation"
          >
            <Volume2 className="w-4 h-4 text-stone-900" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base text-stone-900 truncate font-serif-display">
                {item.word}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
              <span className="capitalize">{partOfSpeech}</span>
              {item.phonetic && (
                <>
                  <span>·</span>
                  <span className="font-mono text-stone-600">{item.phonetic}</span>
                </>
              )}
            </div>

            <p className="text-xs text-stone-700 mt-2 line-clamp-2 leading-relaxed">
              {item.type === 'quote' ? item.word : primaryDef}
            </p>
          </div>
        </div>

        {/* Right Side: Star & Menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleStar}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              item.isStarred ? 'text-amber-500' : 'text-stone-300 hover:text-stone-500'
            }`}
          >
            <Star className={`w-4 h-4 ${item.isStarred ? 'fill-amber-400' : ''}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-30">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-700 hover:bg-stone-50"
                >
                  View details
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                >
                  Remove from library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
