import React, { useState } from 'react';
import { Collection, WordEntry } from '../types';
import { 
  Volume2, Star, BookOpen, ChevronRight, ChevronDown, Plus, 
  SlidersHorizontal, ArrowLeft, MoreVertical, Download, Check, Search, X 
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { BookCover } from './BookCover';
import { ExportModal } from './ExportModal';

interface CollectionsScreenProps {
  collections: Collection[];
  words: WordEntry[];
  selectedCollectionId?: string;
  onSelectCollectionId?: (id: string) => void;
  onSelectWord: (word: WordEntry) => void;
  onToggleStar: (wordId: string) => void;
  onCreateCollection: (title: string, author?: string) => void;
  onOpenBookSearch: () => void;
  onBack?: () => void;
}

export const CollectionsScreen: React.FC<CollectionsScreenProps> = ({
  collections,
  words,
  selectedCollectionId,
  onSelectCollectionId,
  onSelectWord,
  onToggleStar,
  onCreateCollection,
  onOpenBookSearch,
  onBack
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState(collections[0]?.id || '');
  const [filterType, setFilterType] = useState<'All' | 'Words' | 'Phrases' | 'Quotes'>('All');
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [activeAudioWordId, setActiveAudioWordId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBookshelfDrawerOpen, setIsBookshelfDrawerOpen] = useState(false);
  const [shelfSearch, setShelfSearch] = useState('');

  const activeId = selectedCollectionId || internalSelectedId;
  const activeCollection = collections.find(c => c.id === activeId) || collections[0];

  const filteredShelfCollections = collections.filter(c => 
    !shelfSearch.trim() || 
    c.title.toLowerCase().includes(shelfSearch.toLowerCase()) || 
    (c.author && c.author.toLowerCase().includes(shelfSearch.toLowerCase()))
  );

  // Words in this collection
  const collectionWords = words.filter(w => w.collectionId === activeCollection?.id);

  // Counts
  const wordCount = collectionWords.filter(w => w.type === 'word').length;
  const phraseCount = collectionWords.filter(w => w.type === 'phrase' || w.type === 'transition').length;
  const quoteCount = collectionWords.filter(w => w.type === 'quote').length;

  const filteredWords = collectionWords.filter(w => {
    if (filterType === 'All') return true;
    if (filterType === 'Words') return w.type === 'word';
    if (filterType === 'Phrases') return w.type === 'phrase' || w.type === 'transition';
    if (filterType === 'Quotes') return w.type === 'quote';
    return true;
  });

  // Group by chapter if available
  const chapterGroups = filteredWords.reduce((acc, curr) => {
    const ch = curr.chapter || (curr.source?.chapter ? `Chapter ${curr.source.chapter}` : 'Other Discoveries');
    if (!acc[ch]) acc[ch] = [];
    acc[ch].push(curr);
    return acc;
  }, {} as Record<string, WordEntry[]>);

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

  return (
    <div className="flex flex-col min-h-full bg-[#FFFDF7] text-stone-900 pb-28">
      {/* Clean Header with Interactive Book Switcher + + New Book (Option 1 matching Figma Screen 4) */}
      <div className="sticky top-0 z-20 bg-[#FFFDF7]/95 backdrop-blur-md px-4 py-2.5 border-b border-stone-200/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors shrink-0 -ml-1"
              aria-label="Back to previous screen"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Interactive Book Switcher Trigger matching Option 1 */}
          <button
            type="button"
            onClick={() => setIsBookshelfDrawerOpen(true)}
            className="flex items-center gap-2.5 py-1 px-3 rounded-2xl bg-[#FAF6EC] hover:bg-[#F4EEDB] border border-stone-200/90 transition-all text-left group shrink min-w-0 shadow-2xs active:scale-[0.98]"
            title="Open My Bookshelf to switch or browse books"
          >
            {activeCollection && (
              <div className="shrink-0 shadow-xs rounded-sm overflow-hidden my-0.5">
                <BookCover
                  collectionId={activeCollection.id}
                  title={activeCollection.title}
                  author={activeCollection.author}
                  coverImage={activeCollection.coverImage}
                  size="xs"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block leading-none">
                Reading Now
              </span>
              <span className="text-sm font-bold font-serif-display text-stone-950 truncate block mt-0.5">
                {activeCollection?.title || 'Select Book'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-stone-500 group-hover:text-stone-900 transition-transform shrink-0" />
          </button>
        </div>

        {/* Action Controls: Bookshelf Drawer button & New Book */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBookshelfDrawerOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200/60 shadow-2xs"
            title="Open full bookshelf shelf"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Bookshelf ({collections.length})</span>
            <span className="sm:hidden">{collections.length}</span>
          </button>

          <button
            onClick={onOpenBookSearch}
            className="py-1.5 px-3 rounded-xl bg-[#FFE042] hover:bg-[#F7D836] flex items-center gap-1.5 text-xs font-bold text-stone-900 shadow-2xs transition-transform active:scale-95"
            title="Search book online and attach cover"
          >
            <Plus className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
            <span>New Book</span>
          </button>
        </div>
      </div>

      {/* Collection Hero Card matching Mockup screen 4 */}
      {activeCollection && (
        <div className="px-5 pt-4">
          <div className="bg-[#FAF6EC] p-5 rounded-3xl border border-stone-200/80 shadow-xs flex items-center gap-4">
            {/* Illustrated Book Jacket matching ref image - clickable to open shelf */}
            <div 
              onClick={() => setIsBookshelfDrawerOpen(true)}
              className="cursor-pointer group relative transition-transform hover:scale-105"
              title="Click cover to switch book from bookshelf"
            >
              <BookCover
                collectionId={activeCollection.id}
                title={activeCollection.title}
                author={activeCollection.author}
                coverImage={activeCollection.coverImage}
                size="lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <h1 className="text-xl font-bold font-serif-display text-stone-950 truncate">
                  {activeCollection.title}
                </h1>
                <button
                  onClick={() => setIsBookshelfDrawerOpen(true)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
                  title="Switch or change active book"
                >
                  Change
                </button>
              </div>
              <div className="text-xs text-stone-600 font-medium mt-0.5">
                {activeCollection.author}
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
                <span>⏱</span>
                <span>{collectionWords.length} discoveries</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#FFE042] h-full rounded-full"
                  style={{ width: `${Math.min(100, (collectionWords.length / 40) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Chips matching mockup: All, Words (19), Phrases (12), Quotes (5) + Export / Print */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'All', label: 'All', count: collectionWords.length },
              { id: 'Words', label: 'Words', count: wordCount },
              { id: 'Phrases', label: 'Phrases', count: phraseCount },
              { id: 'Quotes', label: 'Quotes', count: quoteCount }
            ].map(tab => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-[#FAF6EC] text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="py-1.5 px-3 rounded-full text-xs font-semibold bg-[#FAF6EC] hover:bg-[#FFE042] text-stone-800 border border-stone-200/80 flex items-center gap-1.5 shrink-0 transition-all shadow-2xs"
            title="Export this collection to Anki deck (.txt) or print flashcards"
          >
            <Download className="w-3.5 h-3.5 text-stone-700" />
            <span className="hidden sm:inline">Export / Print Deck</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Chapters & Items */}
      <div className="p-5 space-y-6">
        {Object.keys(chapterGroups).length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            No items in this collection yet. Look up words and assign them here!
          </div>
        ) : (
          Object.entries(chapterGroups).map(([chapterTitle, items]) => (
            <div key={chapterTitle} className="space-y-3">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {chapterTitle}
              </div>

              <div className="space-y-2.5">
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectWord(item)}
                    className="p-4 bg-white hover:bg-stone-50/80 rounded-2xl border border-stone-200/80 shadow-xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => handlePlayWord(e, item)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                          activeAudioWordId === item.id ? 'bg-[#FFE042]' : 'bg-[#FAF6EC] hover:bg-[#FFE042]'
                        }`}
                        title="Hear pronunciation"
                      >
                        <Volume2 className="w-4 h-4 text-stone-900" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-stone-900 font-serif-display truncate">
                          {item.word}
                        </div>
                        <div className="text-[11px] text-stone-500 capitalize">
                          {item.meanings[0]?.partOfSpeech || item.type}
                        </div>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2 italic font-serif">
                          {item.type === 'quote'
                            ? `"${item.word}"`
                            : item.meanings[0]?.definitions[0]?.example || item.meanings[0]?.definitions[0]?.definition}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          item.isStarred ? 'text-amber-500' : 'text-stone-300 hover:text-stone-500'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Collection Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#FFFDF7] p-6 rounded-3xl shadow-xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Create New Collection</h3>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Collection Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Modernist Poetry, Legal Discourse..."
                className="w-full p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Author / Source (optional)</label>
              <input
                type="text"
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                placeholder="e.g. Virginia Woolf, The Economist..."
                className="w-full p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsCreatingModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTitle.trim()) {
                    onCreateCollection(newTitle.trim(), newAuthor.trim() || undefined);
                    setIsCreatingModal(false);
                    setNewTitle('');
                    setNewAuthor('');
                  }
                }}
                className="px-4 py-2 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 font-bold rounded-xl text-xs"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Deck Modal */}
      {isExportModalOpen && (
        <ExportModal
          title={activeCollection ? `${activeCollection.title} Collection` : 'My Collection'}
          words={filteredWords}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* My Bookshelf Visual Drawer / Modal (Option 1) */}
      {isBookshelfDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in"
          onClick={() => setIsBookshelfDrawerOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-[#FAF6EC]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFE042] flex items-center justify-center text-stone-900 shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-950 text-lg font-serif-display">My Bookshelf</h3>
                  <p className="text-xs text-stone-600 font-sans">
                    {collections.length} books and reading collections
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsBookshelfDrawerOpen(false);
                    onOpenBookSearch();
                  }}
                  className="py-1.5 px-3 rounded-xl bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                  title="Search book online and attach cover"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Book</span>
                </button>
                <button
                  onClick={() => setIsBookshelfDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
                  aria-label="Close bookshelf"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Filter if more than 3 books */}
            {collections.length > 3 && (
              <div className="px-6 pt-3 pb-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={shelfSearch}
                    onChange={(e) => setShelfSearch(e.target.value)}
                    placeholder="Filter your books..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#FAF6EC] rounded-xl text-xs text-stone-900 placeholder-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}

            {/* Books Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredShelfCollections.map((col) => {
                  const isCurrent = col.id === activeId;
                  const wordCountForCol = words.filter(w => w.collectionId === col.id).length;

                  return (
                    <div
                      key={col.id}
                      onClick={() => {
                        if (onSelectCollectionId) {
                          onSelectCollectionId(col.id);
                        } else {
                          setInternalSelectedId(col.id);
                        }
                        setIsBookshelfDrawerOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`p-3.5 rounded-2xl border transition-all text-left flex items-start gap-3 cursor-pointer group ${
                        isCurrent
                          ? 'bg-[#FAF6EC] border-[#FFE042] ring-2 ring-[#FFE042]/50 shadow-sm'
                          : 'bg-white hover:bg-[#FAF6EC]/80 border-stone-200/80 hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      {/* Tactile Book Cover */}
                      <div className="shrink-0 group-hover:scale-105 transition-transform">
                        <BookCover
                          collectionId={col.id}
                          title={col.title}
                          author={col.author}
                          coverImage={col.coverImage}
                          size="md"
                        />
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 min-w-0">
                        {isCurrent && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full mb-1">
                            <Check className="w-3 h-3 text-amber-800 stroke-[2.5]" />
                            <span>Reading Now</span>
                          </div>
                        )}
                        <h4 className="font-bold text-sm font-serif-display text-stone-950 truncate group-hover:text-amber-900 transition-colors">
                          {col.title}
                        </h4>
                        <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                          {col.author || 'Author not specified'}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-stone-600 font-medium mt-2">
                          <span>⏱ {wordCountForCol} discoveries</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-[#FFE042] h-full rounded-full"
                            style={{ width: `${Math.min(100, (wordCountForCol / 40) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* + Add New Book Card in Shelf */}
                <div
                  onClick={() => {
                    setIsBookshelfDrawerOpen(false);
                    onOpenBookSearch();
                  }}
                  className="p-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#FFE042] bg-stone-50/50 hover:bg-[#FAF6EC]/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFE042] group-hover:bg-[#F7D836] flex items-center justify-center text-stone-900 shadow-2xs mb-2 transition-transform group-hover:scale-110">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="font-bold text-xs text-stone-900">Add Another Book</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">Fetch cover online or add custom title</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[#FAF6EC]/60 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500">
              <span>Click any book to switch active vocabulary deck</span>
              <button
                onClick={() => setIsBookshelfDrawerOpen(false)}
                className="py-1 px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
