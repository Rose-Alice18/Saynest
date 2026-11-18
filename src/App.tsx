import React, { useState, useEffect } from 'react';
import { WordEntry, Collection } from './types';
import { INITIAL_WORDS, INITIAL_COLLECTIONS } from './data/initialData';
import { lookupWord } from './utils/lookupService';
import { HeaderNav } from './components/HeaderNav';
import { BottomNav, MainTab } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { WordDetailScreen } from './components/WordDetailScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { CollectionsScreen } from './components/CollectionsScreen';
import { ExpressionsScreen } from './components/ExpressionsScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { CommuteScreen } from './components/CommuteScreen';
import { SaveModal } from './components/SaveModal';
import { PronunciationModal } from './components/PronunciationModal';
import { ScanPageModal, PAGE_DISCOVERIES } from './components/ScanPageModal';
import { AddQuoteModal } from './components/AddQuoteModal';
import { QuickAddModal } from './components/QuickAddModal';
import { BookSearchModal } from './components/BookSearchModal';

interface NavigationSource {
  tab: MainTab;
  collectionId?: string;
  fromScanPage?: boolean;
}

export default function App() {
  // Persistent Words and Collections
  const [words, setWords] = useState<WordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('saynest_words');
      return saved ? JSON.parse(saved) : INITIAL_WORDS;
    } catch {
      return INITIAL_WORDS;
    }
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const saved = localStorage.getItem('saynest_collections');
      return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
    } catch {
      return INITIAL_COLLECTIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('saynest_words', JSON.stringify(words));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [words]);

  useEffect(() => {
    try {
      localStorage.setItem('saynest_collections', JSON.stringify(collections));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [collections]);

  // Persistent Search & Lookup History (Never lost even if deleted from Saved Library)
  const [searchHistory, setSearchHistory] = useState<WordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('saynest_search_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WORDS.map((w, idx) => ({
      ...w,
      searchedAt: new Date(Date.now() - idx * 3600000).toISOString()
    }));
  });

  useEffect(() => {
    try {
      localStorage.setItem('saynest_search_history', JSON.stringify(searchHistory));
    } catch (e) {
      console.warn('History storage save error:', e);
    }
  }, [searchHistory]);

  // Navigation State with Memory of Previous Collection & Page
  const [currentTab, setCurrentTab] = useState<MainTab>('Home');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('pride-and-prejudice');
  const [navigationSource, setNavigationSource] = useState<NavigationSource>({
    tab: 'Home',
    collectionId: 'pride-and-prejudice'
  });
  const [activeWordDetail, setActiveWordDetail] = useState<WordEntry | null>(null);
  const [isCommuteMode, setIsCommuteMode] = useState(false);

  // Scroll to top whenever changing screens, opening word detail, or entering commute mode
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentTab, activeWordDetail, isCommuteMode, selectedCollectionId]);

  // Modals
  const [saveModalWord, setSaveModalWord] = useState<WordEntry | null>(null);
  const [practiceModalWord, setPracticeModalWord] = useState<WordEntry | null>(null);
  const [isScanPageOpen, setIsScanPageOpen] = useState(false);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isBookSearchOpen, setIsBookSearchOpen] = useState(false);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler: Select or Add Book with cover
  const handleSelectOrAddBook = (book: {
    title: string;
    author: string;
    coverUrl?: string;
    pageCount?: number;
    setAsCurrentlyReading: boolean;
  }) => {
    setCollections((prev) => {
      const existing = prev.find(
        (c) => c.title.toLowerCase() === book.title.toLowerCase()
      );
      if (existing) {
        const updated = {
          ...existing,
          author: book.author || existing.author,
          coverImage: book.coverUrl || existing.coverImage,
          pageCount: book.pageCount || existing.pageCount
        };
        if (book.setAsCurrentlyReading) {
          return [updated, ...prev.filter((c) => c.id !== existing.id)];
        }
        return prev.map((c) => (c.id === existing.id ? updated : c));
      }

      const newCol: Collection = {
        id: `col-${Date.now()}`,
        title: book.title,
        author: book.author,
        coverImage: book.coverUrl,
        pageCount: book.pageCount,
        discoveriesCount: 0,
        accentColor: '#FFE042',
        totalChapters: 20,
        currentChapter: 1,
        isCurrentlyReading: book.setAsCurrentlyReading
      };

      if (book.setAsCurrentlyReading) {
        return [newCol, ...prev];
      }
      return [...prev, newCol];
    });

    showToast(`Attached "${book.title}" with authentic cover!`);
  };

  const handleSetCurrentlyReading = (collectionId: string) => {
    setCollections((prev) => {
      const chosen = prev.find((c) => c.id === collectionId);
      if (!chosen) return prev;
      showToast(`Switched reading book to "${chosen.title}"`);
      return [chosen, ...prev.filter((c) => c.id !== collectionId)];
    });
  };

  // Handler: Lookup Word
  const handleSearchLookup = async (query: string) => {
    setIsLoadingLookup(true);
    try {
      const result = await lookupWord(query);
      const withTimestamp: WordEntry = {
        ...result,
        searchedAt: new Date().toISOString()
      };

      // Add to persistent search history (newest on top, deduplicated by word)
      setSearchHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.word.toLowerCase() !== result.word.toLowerCase()
        );
        return [withTimestamp, ...filtered];
      });

      setActiveWordDetail(result);
    } catch (err) {
      console.error('Lookup failed:', err);
      showToast('Could not fetch word details. Please try again.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Handler: Save word to library
  const handleSaveWord = (updatedWord: WordEntry) => {
    setWords((prev) => {
      const existingIdx = prev.findIndex((w) => w.id === updatedWord.id || w.word.toLowerCase() === updatedWord.word.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedWord;
        return copy;
      }
      return [updatedWord, ...prev];
    });

    // Also ensure it is recorded in search history
    setSearchHistory((prev) => {
      const existingIdx = prev.findIndex(item => item.word.toLowerCase() === updatedWord.word.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...updatedWord, searchedAt: copy[existingIdx].searchedAt || new Date().toISOString() };
        return copy;
      }
      return [{ ...updatedWord, searchedAt: new Date().toISOString() }, ...prev];
    });

    // Update collection discovery count
    if (updatedWord.collectionId) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === updatedWord.collectionId
            ? { ...c, discoveriesCount: c.discoveriesCount + 1 }
            : c
        )
      );
    }

    showToast(`Saved "${updatedWord.word}" to your nest!`);
  };

  // Handler: Toggle Star
  const handleToggleStar = (wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, isStarred: !w.isStarred } : w))
    );
    if (activeWordDetail && activeWordDetail.id === wordId) {
      setActiveWordDetail((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : null));
    }
  };

  // Handler: Delete Word from Saved Library (Preserves word in Search History Archive!)
  const handleDeleteWord = (wordId: string) => {
    const target = words.find((w) => w.id === wordId);
    setWords((prev) => prev.filter((w) => w.id !== wordId));
    if (activeWordDetail && activeWordDetail.id === wordId) {
      setActiveWordDetail(null);
    }
    showToast(`Removed "${target?.word || 'word'}" from saved library (kept in Search History)`);
  };

  // Handler: Re-save a word from Search History into Saved Library
  const handleSaveFromHistory = (entry: WordEntry) => {
    handleSaveWord(entry);
  };

  // Handler: Clear Search History Archive
  const handleClearHistory = () => {
    setSearchHistory([]);
    showToast('Search history cleared');
  };

  // Handler: Create Collection
  const handleCreateCollection = (title: string, author?: string): string => {
    const id = `col-${Date.now()}`;
    const newCol: Collection = {
      id,
      title,
      author: author || 'Personal Collection',
      discoveriesCount: 0,
      accentColor: '#FFE042',
      totalChapters: 10,
      currentChapter: 1
    };
    setCollections((prev) => [...prev, newCol]);
    showToast(`Created collection "${title}"`);
    return id;
  };

  // Handler: Return to previous context from Word Detail Screen
  const handleBackFromWordDetail = () => {
    setActiveWordDetail(null);
    if (navigationSource.fromScanPage) {
      setIsScanPageOpen(true);
    } else {
      if (navigationSource.tab) {
        setCurrentTab(navigationSource.tab);
      }
      if (navigationSource.collectionId) {
        setSelectedCollectionId(navigationSource.collectionId);
      }
    }
  };

  // Handler: Save Extracted Discovery from Book Scan or Text Paste
  const handleSaveExtractedWord = (w: string, context: string, type?: 'word' | 'phrase' | 'transition') => {
    const targetColId = selectedCollectionId || 'pride-and-prejudice';
    const targetCol = collections.find(c => c.id === targetColId) || collections[0];

    const existingWord = words.find(item => item.word.toLowerCase() === w.toLowerCase());
    if (existingWord) {
      const updated: WordEntry = {
        ...existingWord,
        collectionId: targetCol?.id,
        chapter: existingWord.chapter || 'Chapter 3',
        source: existingWord.source || {
          type: 'Book',
          title: targetCol?.title || 'Pride and Prejudice',
          author: targetCol?.author || 'Jane Austen',
          chapter: '3',
          page: '27'
        }
      };
      handleSaveWord(updated);
      return;
    }

    const lookupMatch = PAGE_DISCOVERIES.find(d => d.word.toLowerCase() === w.toLowerCase());
    const entryType = type || lookupMatch?.type || (w.includes(' ') ? 'transition' : 'word');

    const newEntry: WordEntry = {
      id: `extracted-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word: w,
      type: entryType,
      phonetic: lookupMatch?.partOfSpeech === 'transition' ? '/ɪn ˈkɒn.sɪ.kwəns/' : '',
      syllables: w.replace(/\s+/g, '-'),
      accents: [
        { accent: 'British', ipa: '', flag: '🇬🇧', langCode: 'en-GB' },
        { accent: 'American', ipa: '', flag: '🇺🇸', langCode: 'en-US' }
      ],
      meanings: [
        {
          partOfSpeech: lookupMatch?.partOfSpeech || (w.includes(' ') ? 'transition' : 'word'),
          definitions: [
            {
              definition: lookupMatch?.definition || `Vocabulary item discovered from ${targetCol?.title || 'Pride and Prejudice'}.`,
              example: context
            }
          ]
        }
      ],
      dateAdded: new Date().toISOString(),
      groupDate: 'Today',
      chapter: 'Chapter 3',
      collectionId: targetCol?.id,
      source: {
        type: 'Book',
        title: targetCol?.title || 'Pride and Prejudice',
        author: targetCol?.author || 'Jane Austen',
        chapter: '3',
        page: '27'
      },
      tags: [entryType, 'book-extract'],
      isStarred: false,
      reviewStatus: {
        dueForReview: true,
        intervalDays: 1,
        repetitions: 1
      }
    };

    handleSaveWord(newEntry);
    showToast(`Saved "${w}" to ${targetCol?.title || 'Pride and Prejudice'}`);
  };

  // Count items due for review
  const reviewDueCount = words.filter((w) => w.reviewStatus?.dueForReview !== false).length;

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col antialiased text-stone-900">
      {/* Top Bar adhering to Top Bar Contract (Desktop & Tablet) */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setActiveWordDetail(null);
          setIsCommuteMode(false);
          setCurrentTab(tab);
        }}
        onOpenCommuteMode={() => {
          setActiveWordDetail(null);
          setIsCommuteMode(true);
        }}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        reviewDueCount={reviewDueCount}
      />

      {/* Main Fluid Responsive Container */}
      <main className="flex-1 w-full bg-[#FFFDF7] flex flex-col">
        {/* Active Screen View */}
        {isCommuteMode ? (
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
            <CommuteScreen
              words={words}
              onBack={() => setIsCommuteMode(false)}
            />
          </div>
        ) : activeWordDetail ? (
          <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
            <WordDetailScreen
              word={activeWordDetail}
              onBack={handleBackFromWordDetail}
              onOpenSaveModal={(w) => setSaveModalWord(w)}
              onOpenPractice={(w) => setPracticeModalWord(w)}
              onToggleStar={handleToggleStar}
              onSearchLookup={handleSearchLookup}
              isSaved={words.some((w) => w.word.toLowerCase() === activeWordDetail.word.toLowerCase())}
            />
          </div>
        ) : (
          <div className="flex-1 w-full">
            {currentTab === 'Home' && (
              <HomeScreen
                recentWords={words}
                collections={collections}
                onSearchLookup={handleSearchLookup}
                onSelectWord={(w) => {
                  setNavigationSource({ tab: 'Home', collectionId: selectedCollectionId });
                  setActiveWordDetail(w);
                }}
                onOpenScanPage={() => setIsScanPageOpen(true)}
                onOpenPasteText={() => setIsScanPageOpen(true)}
                onOpenAddQuote={() => setIsAddQuoteOpen(true)}
                onOpenReview={() => setCurrentTab('Review')}
                onOpenCollections={(colId) => {
                  if (colId) setSelectedCollectionId(colId);
                  setCurrentTab('Collections');
                }}
                onOpenLibrary={() => setCurrentTab('Library')}
                onOpenBookSearch={() => setIsBookSearchOpen(true)}
                onOpenExpressions={() => setCurrentTab('Expressions')}
                onOpenCommuteMode={() => setIsCommuteMode(true)}
                isLoadingLookup={isLoadingLookup}
              />
            )}

            {currentTab === 'Library' && (
              <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
                <LibraryScreen
                  words={words}
                  searchHistory={searchHistory}
                  onSelectWord={(w) => {
                    setNavigationSource({ tab: 'Library' });
                    setActiveWordDetail(w);
                  }}
                  onToggleStar={handleToggleStar}
                  onDeleteWord={handleDeleteWord}
                  onSaveFromHistory={handleSaveFromHistory}
                  onClearHistory={handleClearHistory}
                />
              </div>
            )}

            {currentTab === 'Collections' && (
              <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
                <CollectionsScreen
                  collections={collections}
                  words={words}
                  selectedCollectionId={selectedCollectionId}
                  onSelectCollectionId={setSelectedCollectionId}
                  onSelectWord={(w) => {
                    setNavigationSource({ tab: 'Collections', collectionId: selectedCollectionId });
                    setActiveWordDetail(w);
                  }}
                  onToggleStar={handleToggleStar}
                  onCreateCollection={handleCreateCollection}
                  onOpenBookSearch={() => setIsBookSearchOpen(true)}
                  onBack={() => setCurrentTab('Home')}
                />
              </div>
            )}

            {currentTab === 'Expressions' && (
              <ExpressionsScreen
                userSavedTransitions={words.filter(w => w.type === 'transition' || w.tags?.includes('transition'))}
                onSelectWord={(w) => {
                  setNavigationSource({ tab: 'Expressions' });
                  setActiveWordDetail(w);
                }}
                onOpenSaveModal={(w) => setSaveModalWord(w)}
                onBackToHome={() => setCurrentTab('Home')}
                onAddCustomExpression={(expr) => handleSaveWord(expr)}
              />
            )}

            {currentTab === 'Review' && (
              <ReviewScreen
                words={words}
                onOpenCommuteMode={() => setIsCommuteMode(true)}
                onFinishSession={() => setCurrentTab('Home')}
                onBack={() => setCurrentTab('Home')}
              />
            )}
          </div>
        )}

        {/* Mobile Bottom Navigation (Only on mobile for root screens Home, Library, Collections) */}
        {!isCommuteMode && !activeWordDetail && (currentTab === 'Home' || currentTab === 'Library' || currentTab === 'Collections') && (
          <BottomNav
            currentTab={currentTab}
            onTabChange={(tab) => {
              setActiveWordDetail(null);
              setCurrentTab(tab);
            }}
            onQuickAdd={() => setIsQuickAddOpen(true)}
            reviewDueCount={reviewDueCount}
          />
        )}
      </main>

      {/* Modals */}
      {saveModalWord && (
        <SaveModal
          word={saveModalWord}
          collections={collections}
          onClose={() => setSaveModalWord(null)}
          onSave={handleSaveWord}
          onCreateCollection={handleCreateCollection}
        />
      )}

      {practiceModalWord && (
        <PronunciationModal
          word={practiceModalWord}
          onClose={() => setPracticeModalWord(null)}
        />
      )}

      {isScanPageOpen && (
        <ScanPageModal
          onClose={() => setIsScanPageOpen(false)}
          onDefineWord={(w) => {
            setNavigationSource({ tab: currentTab, collectionId: selectedCollectionId, fromScanPage: true });
            setIsScanPageOpen(false);
            handleSearchLookup(w);
          }}
          onSaveExtractedWord={handleSaveExtractedWord}
        />
      )}

      {isAddQuoteOpen && (
        <AddQuoteModal
          collections={collections}
          onClose={() => setIsAddQuoteOpen(false)}
          onSaveQuote={handleSaveWord}
        />
      )}

      {isQuickAddOpen && (
        <QuickAddModal
          onClose={() => setIsQuickAddOpen(false)}
          onSearchLookup={handleSearchLookup}
          onOpenScanPage={() => setIsScanPageOpen(true)}
          onOpenPasteText={() => setIsScanPageOpen(true)}
          onOpenAddQuote={() => setIsAddQuoteOpen(true)}
          onOpenExpressions={() => setCurrentTab('Expressions')}
        />
      )}

      {isBookSearchOpen && (
        <BookSearchModal
          collections={collections}
          onClose={() => setIsBookSearchOpen(false)}
          onSelectOrAddBook={handleSelectOrAddBook}
          onSetCurrentlyReading={handleSetCurrentlyReading}
        />
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 py-2.5 px-5 bg-stone-900 text-white rounded-full text-xs font-semibold shadow-xl animate-in fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFE042]"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
