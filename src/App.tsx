import React, { useState, useEffect, useRef } from 'react';
import { WordEntry, Collection } from './types';
import { INITIAL_WORDS, INITIAL_COLLECTIONS } from './data/initialData';
import { lookupWord } from './utils/lookupService';
import { dueWords, estimateMinutes, scheduleReview, ReviewRating } from './utils/review';
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
    // Depend on the word's id, not the object, so filling in AI details for the
    // same word doesn't jump the page back to the top while it's being read.
  }, [currentTab, activeWordDetail?.id, isCommuteMode, selectedCollectionId]);

  // Which Library list is showing; remembered so "See all" can open Saved
  const [libraryView, setLibraryView] = useState<'history' | 'saved'>('history');

  // Modals
  const [saveModalWord, setSaveModalWord] = useState<WordEntry | null>(null);
  const [practiceModalWord, setPracticeModalWord] = useState<WordEntry | null>(null);
  // 'hidden' keeps the scan modal (and its text, photo and results) alive
  // while a word from it is opened with Define, so going back restores it
  const [scanModal, setScanModal] = useState<'closed' | 'open' | 'hidden'>('closed');
  const scanModalRef = useRef(scanModal);
  scanModalRef.current = scanModal;
  const setIsScanPageOpen = (open: boolean) => setScanModal(open ? 'open' : 'closed');
  // Leaving for another screen means the hidden scan session is done
  const discardHiddenScan = () => setScanModal((m) => (m === 'hidden' ? 'closed' : m));
  // "Paste text" and "Scan a page" share a modal; this picks its starting tab
  const [scanPageTab, setScanPageTab] = useState<'scan' | 'paste'>('scan');
  const openScanPage = (tab: 'scan' | 'paste') => {
    setScanPageTab(tab);
    setIsScanPageOpen(true);
  };
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isBookSearchOpen, setIsBookSearchOpen] = useState(false);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // "Showing results for tired" when a search like "tird" was corrected
  const [spellingFix, setSpellingFix] = useState<{ from: string; to: string } | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; run: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A message at the bottom of the screen; with an action (like Undo) it stays a bit longer
  const showToast = (message: string, action?: { label: string; run: () => void }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    setToastAction(action ?? null);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, action ? 6000 : 3000);
  };

  // Put an unsaved word back exactly as it was (notes, collection, review progress)
  const undoUnsave = (entry: WordEntry) => ({
    label: 'Undo',
    run: () => {
      setWords((prev) => (prev.some((w) => w.id === entry.id) ? prev : [entry, ...prev]));
      showToast(`"${entry.word}" is back in your saved library`);
    }
  });

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
  //
  // AI lookups can take 5-15s, so we first ask for the dictionary result
  // (about 1s) and show it straight away, then fill in the AI details when
  // they arrive. If the dictionary doesn't know the word, we keep the spinner
  // and wait for the AI rather than showing placeholder text.
  const lookupSeq = useRef(0);
  const [isEnhancingLookup, setIsEnhancingLookup] = useState(false);

  const showLookupResult = (result: WordEntry) => {
    const withTimestamp: WordEntry = { ...result, searchedAt: new Date().toISOString() };
    // Add to persistent search history (newest on top, deduplicated by word)
    setSearchHistory((prev) => [
      withTimestamp,
      ...prev.filter((item) => item.word.toLowerCase() !== result.word.toLowerCase()),
    ]);
    setActiveWordDetail(result);
  };

  // Copy the AI content onto an existing entry, keeping its id and anything
  // the user added (tags, star, collection, notes).
  const withAiContent = (existing: WordEntry, ai: WordEntry): WordEntry => ({
    ...existing,
    type: ai.type,
    phonetic: ai.phonetic,
    syllables: ai.syllables,
    accents: ai.accents,
    meanings: ai.meanings,
    nuance: ai.nuance,
    relatedExpressions: ai.relatedExpressions,
  });

  const handleSearchLookup = async (query: string, options: { exact?: boolean } = {}) => {
    const seq = ++lookupSeq.current; // ignore results from an older search
    setIsLoadingLookup(true);
    setIsEnhancingLookup(false);
    setSpellingFix(null);
    try {
      const quick = await lookupWord(query, { quick: true, exact: options.exact });
      if (seq !== lookupSeq.current) return;

      if (quick.source === 'seed' || quick.source === 'ai') {
        showLookupResult(quick.entry);
        return;
      }

      if (quick.source === 'dictionary') {
        showLookupResult(quick.entry);
        setIsLoadingLookup(false);
        setIsEnhancingLookup(true);
      }

      const full = await lookupWord(query, { exact: options.exact });
      if (seq !== lookupSeq.current) return;

      if (quick.source === 'fallback') {
        // Nothing to show yet, so show whatever the full lookup found
        // (possibly the correctly spelt word, if the search was misspelt)
        setSpellingFix(full.spellingFix ?? null);
        showLookupResult(full.entry);
      } else if (full.source === 'ai') {
        const key = quick.entry.word.toLowerCase();
        const sameWord = (w: WordEntry) => w.word.toLowerCase() === key;
        setActiveWordDetail((prev) => (prev && prev.id === quick.entry.id ? withAiContent(prev, full.entry) : prev));
        setSearchHistory((prev) => prev.map((w) => (sameWord(w) ? withAiContent(w, full.entry) : w)));
        // If they saved the word while the AI was loading, upgrade the saved copy too
        setWords((prev) => prev.map((w) => (sameWord(w) ? withAiContent(w, full.entry) : w)));
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      if (seq === lookupSeq.current) showToast('Could not fetch word details. Please try again.');
    } finally {
      if (seq === lookupSeq.current) {
        setIsLoadingLookup(false);
        setIsEnhancingLookup(false);
      }
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

    // Collection word counts are worked out from the saved words (see
    // collectionsWithCounts), so moving a word between collections keeps them right

    showToast(`Saved "${updatedWord.word}" to your nest!`);
  };

  // Handler: Toggle Star
  // Stars mark favourites: they get their own Review deck and Library filter.
  // A search result can have a different id from its saved copy, so match by text too.
  const handleToggleStar = (wordId: string) => {
    const detail = activeWordDetail && activeWordDetail.id === wordId ? activeWordDetail : null;
    const saved =
      words.find((w) => w.id === wordId) ||
      (detail ? words.find((w) => w.word.toLowerCase() === detail.word.toLowerCase()) : undefined);

    if (saved) {
      const starred = !saved.isStarred;
      setWords((prev) => prev.map((w) => (w.id === saved.id ? { ...w, isStarred: starred } : w)));
      if (detail) setActiveWordDetail({ ...detail, isStarred: starred });
      showToast(starred ? `Starred "${saved.word}". Practise starred words in Review → Custom` : `Unstarred "${saved.word}"`);
    } else if (detail) {
      // Starring a word you haven't saved yet saves it, so the star isn't lost
      const entry = { ...detail, isStarred: true };
      handleSaveWord(entry);
      setActiveWordDetail(entry);
      showToast(`Saved and starred "${detail.word}"`);
    }
  };

  // Handler: Delete Word from Saved Library (Preserves word in Search History Archive!)
  const handleDeleteWord = (wordId: string) => {
    const target = words.find((w) => w.id === wordId);
    setWords((prev) => prev.filter((w) => w.id !== wordId));
    if (activeWordDetail && activeWordDetail.id === wordId) {
      setActiveWordDetail(null);
    }
    showToast(`Removed "${target?.word || 'word'}" from saved`, target ? undoUnsave(target) : undefined);
  };

  // Handler: Unsave the word that's open, without leaving its page
  const handleUnsaveWord = (text: string) => {
    const target = words.find((w) => w.word.toLowerCase() === text.toLowerCase());
    if (!target) return;
    setWords((prev) => prev.filter((w) => w.id !== target.id));
    showToast(`Removed "${target.word}" from saved`, undoUnsave(target));
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
    if (canGoBack) {
      // Going back also brings back a scan session hidden by Define
      window.history.back();
    } else if (navigationSource.fromScanPage) {
      setActiveWordDetail(null);
      setIsScanPageOpen(true);
    } else {
      setActiveWordDetail(null);
      if (navigationSource.tab) {
        setCurrentTab(navigationSource.tab);
      }
      if (navigationSource.collectionId) {
        setSelectedCollectionId(navigationSource.collectionId);
      }
    }
  };

  // Handler: Save Extracted Discovery from Book Scan or Text Paste
  // meta carries what we know about where it came from (the sample page knows
  // its chapter and page; AI-extracted words come with a meaning)
  const handleSaveExtractedWord = (
    w: string,
    context: string,
    type?: 'word' | 'phrase' | 'transition',
    meta: { definition?: string; partOfSpeech?: string; chapter?: string; page?: string; collectionId?: string } = {}
  ) => {
    // The scan screen says where to save; '' means no collection.
    // Without a choice, use the book being read now (the first collection).
    const targetCol =
      meta.collectionId === undefined
        ? collections[0]
        : collections.find((c) => c.id === meta.collectionId);
    const fromBook = !!targetCol;

    const existingWord = words.find(item => item.word.toLowerCase() === w.toLowerCase());
    if (existingWord) {
      const updated: WordEntry = {
        ...existingWord,
        collectionId: targetCol?.id,
        chapter: existingWord.chapter || (meta.chapter ? `Chapter ${meta.chapter}` : undefined),
        source: existingWord.source || {
          type: fromBook ? 'Book' : 'Other',
          title: targetCol?.title,
          author: targetCol?.author,
          chapter: meta.chapter,
          page: meta.page
        }
      };
      handleSaveWord(updated);
      return;
    }

    const lookupMatch = PAGE_DISCOVERIES.find(d => d.word.toLowerCase() === w.toLowerCase());
    const entryType = type || lookupMatch?.type || (w.includes(' ') ? 'transition' : 'word');
    const definition = meta.definition || lookupMatch?.definition;

    const newEntry: WordEntry = {
      id: `extracted-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word: w,
      type: entryType,
      phonetic: '',
      syllables: w.replace(/\s+/g, '-'),
      accents: [
        { accent: 'British', ipa: '', flag: '🇬🇧', langCode: 'en-GB' },
        { accent: 'American', ipa: '', flag: '🇺🇸', langCode: 'en-US' }
      ],
      meanings: [
        {
          partOfSpeech: meta.partOfSpeech || lookupMatch?.partOfSpeech || (w.includes(' ') ? 'phrase' : 'word'),
          definitions: [
            {
              // No definition yet: open the word to look it up
              definition: definition || 'Open this word to look up its meaning.',
              example: context
            }
          ]
        }
      ],
      dateAdded: new Date().toISOString(),
      chapter: meta.chapter ? `Chapter ${meta.chapter}` : undefined,
      collectionId: targetCol?.id,
      source: {
        type: fromBook ? 'Book' : 'Other',
        title: targetCol?.title,
        author: targetCol?.author,
        chapter: meta.chapter,
        page: meta.page
      },
      tags: fromBook ? [entryType, 'book-extract'] : [entryType],
      isStarred: false,
      reviewStatus: {
        dueForReview: true,
        intervalDays: 0,
        repetitions: 0
      }
    };

    handleSaveWord(newEntry);
    showToast(`Saved "${w}" to ${targetCol ? targetCol.title : 'your library'}`);
  };

  // ---------------------------------------------------------------------------
  // Browser history
  //
  // SayNest is one page, so without this the browser's Back button leaves the
  // app entirely. Each screen change (tab, word, commute mode) is pushed as a
  // history entry; Back/Forward restore it, and a refresh reopens the same
  // screen. Modals aren't history entries, but Back closes any that are open.
  // ---------------------------------------------------------------------------
  type NavSnapshot = {
    saynest: true;
    idx: number;
    tab: MainTab;
    commute: boolean;
    collectionId: string;
    word: WordEntry | null;
  };
  const navKeyOf = (tab: MainTab, commute: boolean, wordId: string | undefined, collectionId: string) =>
    `${tab}|${commute}|${wordId ?? ''}|${collectionId}`;
  const navKey = navKeyOf(currentTab, isCommuteMode, activeWordDetail?.id, selectedCollectionId);

  const navIdxRef = useRef(0);
  const lastNavKeyRef = useRef<string | null>(null);
  const restoringNavRef = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const applySnapshot = (s: NavSnapshot) => {
    const key = navKeyOf(s.tab, s.commute, s.word?.id, s.collectionId);
    // The state changes below shouldn't be pushed as a new history entry. Only
    // flag it if the screen will actually change, or the flag would linger and
    // swallow the next real navigation.
    const currentKey = lastNavKeyRef.current ?? navKey;
    if (key !== currentKey) restoringNavRef.current = true;
    lastNavKeyRef.current = key;
    navIdxRef.current = s.idx;
    setCanGoBack(s.idx > 0);
    setCurrentTab(s.tab);
    setIsCommuteMode(s.commute);
    setSelectedCollectionId(s.collectionId);
    // Prefer the latest copy of the word (AI details may have arrived since)
    const fresh = s.word && [...searchHistory, ...words].find((w) => w.id === s.word!.id);
    setActiveWordDetail(fresh || s.word);
  };

  useEffect(() => {
    const snapshot = (idx: number): NavSnapshot => ({
      saynest: true,
      idx,
      tab: currentTab,
      commute: isCommuteMode,
      collectionId: selectedCollectionId,
      word: activeWordDetail,
    });

    // First render: reopen the screen from before a refresh, or record this one
    if (lastNavKeyRef.current === null) {
      const existing = window.history.state as NavSnapshot | null;
      if (existing?.saynest) applySnapshot(existing);
      else window.history.replaceState(snapshot(0), '');
      lastNavKeyRef.current ??= navKey;
      return;
    }
    if (restoringNavRef.current) {
      restoringNavRef.current = false;
      return;
    }
    if (navKey === lastNavKeyRef.current) {
      // Same screen, updated content (e.g. AI details arrived): keep the entry fresh
      window.history.replaceState(snapshot(navIdxRef.current), '');
      return;
    }
    navIdxRef.current += 1;
    window.history.pushState(snapshot(navIdxRef.current), '');
    lastNavKeyRef.current = navKey;
    setCanGoBack(true);
  }, [navKey, activeWordDetail]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const s = e.state as NavSnapshot | null;
      if (!s?.saynest) return;
      // Close anything open on top of the screen
      setSaveModalWord(null);
      setPracticeModalWord(null);
      // A scan session hidden by Define comes back once we're off the word
      // page; an open scan modal is closed like any other
      if (scanModalRef.current === 'hidden') {
        if (!s.word) setScanModal('open');
      } else {
        setScanModal('closed');
      }
      setIsAddQuoteOpen(false);
      setIsQuickAddOpen(false);
      setIsBookSearchOpen(false);
      // Stop a lookup that's still loading from opening its word afterwards
      lookupSeq.current++;
      setIsLoadingLookup(false);
      setIsEnhancingLookup(false);
      applySnapshot(s);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [words, searchHistory]);

  // In-app Back buttons step back through history when there is somewhere to
  // go, so they behave the same as the browser's Back button
  const goBack = (fallback: () => void) => {
    if (canGoBack) window.history.back();
    else fallback();
  };

  // Review: one source of truth for what's due, used by the badges, the Home
  // card and the Review screen, so they always agree
  const reviewDueCount = dueWords(words).length;
  const handleRateReview = (wordId: string, rating: ReviewRating) => {
    setWords((prev) => prev.map((w) => (w.id === wordId ? scheduleReview(w, rating) : w)));
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col antialiased text-stone-900">
      {/* Top Bar adhering to Top Bar Contract (Desktop & Tablet) */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          discardHiddenScan();
          setActiveWordDetail(null);
          setIsCommuteMode(false);
          setCurrentTab(tab);
        }}
        onOpenCommuteMode={() => {
          discardHiddenScan();
          setActiveWordDetail(null);
          setIsCommuteMode(true);
        }}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        reviewDueCount={reviewDueCount}
      />

      {/* Main Fluid Responsive Container */}
      <main className="flex-1 w-full bg-[#FFFDF7] flex flex-col">
        {/* Small Back link (the word and commute screens have their own) */}
        {canGoBack && !activeWordDetail && !isCommuteMode && (currentTab === 'Home' || currentTab === 'Library') && (
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 py-1 px-2 -ml-2 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <span aria-hidden="true">←</span> Back
            </button>
          </div>
        )}

        {/* Active Screen View */}
        {isCommuteMode ? (
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
            <CommuteScreen
              words={words}
              onBack={() => goBack(() => setIsCommuteMode(false))}
            />
          </div>
        ) : activeWordDetail ? (
          <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
            <WordDetailScreen
              word={(() => {
                // Show the saved copy's star, even if this result came from a fresh search
                const savedCopy = words.find((w) => w.word.toLowerCase() === activeWordDetail.word.toLowerCase());
                return savedCopy && !!savedCopy.isStarred !== !!activeWordDetail.isStarred
                  ? { ...activeWordDetail, isStarred: savedCopy.isStarred }
                  : activeWordDetail;
              })()}
              onBack={handleBackFromWordDetail}
              onOpenSaveModal={(w) => setSaveModalWord(w)}
              onOpenPractice={(w) => setPracticeModalWord(w)}
              onToggleStar={handleToggleStar}
              onUnsave={() => handleUnsaveWord(activeWordDetail.word)}
              onSearchLookup={handleSearchLookup}
              spellingFix={spellingFix && spellingFix.to.toLowerCase() === activeWordDetail.word.toLowerCase() ? spellingFix : null}
              onSearchExact={(w) => handleSearchLookup(w, { exact: true })}
              isEnhancing={isEnhancingLookup}
              isSaved={words.some((w) => w.word.toLowerCase() === activeWordDetail.word.toLowerCase())}
            />
          </div>
        ) : (
          <div className="flex-1 w-full">
            {currentTab === 'Home' && (
              <HomeScreen
                recentWords={searchHistory}
                savedWords={words}
                collections={collections}
                onSearchLookup={handleSearchLookup}
                onSelectWord={(w) => {
                  setNavigationSource({ tab: 'Home', collectionId: selectedCollectionId });
                  setActiveWordDetail(w);
                }}
                onOpenScanPage={() => openScanPage('scan')}
                onOpenPasteText={() => openScanPage('paste')}
                onOpenAddQuote={() => setIsAddQuoteOpen(true)}
                onOpenReview={() => setCurrentTab('Review')}
                onOpenCollections={(colId) => {
                  if (colId) setSelectedCollectionId(colId);
                  setCurrentTab('Collections');
                }}
                onOpenLibrary={() => {
                  // "See all" sits under recent lookups, so open Search History
                  setLibraryView('history');
                  setCurrentTab('Library');
                }}
                onOpenBookSearch={() => setIsBookSearchOpen(true)}
                onOpenExpressions={() => setCurrentTab('Expressions')}
                onOpenCommuteMode={() => setIsCommuteMode(true)}
                isLoadingLookup={isLoadingLookup}
                reviewDueCount={reviewDueCount}
                reviewMinutes={estimateMinutes(reviewDueCount)}
              />
            )}

            {currentTab === 'Library' && (
              <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
                <LibraryScreen
                  words={words}
                  searchHistory={searchHistory}
                  activeView={libraryView}
                  onChangeView={setLibraryView}
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
                  onSetCurrentlyReading={handleSetCurrentlyReading}
                  onBack={() => goBack(() => setCurrentTab('Home'))}
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
                onSearchLookup={(phrase) => {
                  setNavigationSource({ tab: 'Expressions' });
                  handleSearchLookup(phrase);
                }}
                onBackToHome={() => goBack(() => setCurrentTab('Home'))}
                onAddCustomExpression={(expr) => handleSaveWord(expr)}
              />
            )}

            {currentTab === 'Review' && (
              <ReviewScreen
                words={words}
                currentBook={collections[0]}
                onRateWord={handleRateReview}
                onOpenCommuteMode={() => setIsCommuteMode(true)}
                onFinishSession={() => setCurrentTab('Home')}
                onBack={() => goBack(() => setCurrentTab('Home'))}
              />
            )}
          </div>
        )}

        {/* Mobile Bottom Navigation on every main screen (the word page and
            Commute mode have their own controls) */}
        {!isCommuteMode && !activeWordDetail && (
          <BottomNav
            currentTab={currentTab}
            onTabChange={(tab) => {
              discardHiddenScan();
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

      {scanModal !== 'closed' && (
        // Hidden rather than unmounted while a word from it is open
        <div hidden={scanModal === 'hidden'}>
          <ScanPageModal
            initialTab={scanPageTab}
            onClose={() => setScanModal('closed')}
            collections={collections}
            onCreateCollection={(title) => handleCreateCollection(title)}
            onDefineWord={(w) => {
              setNavigationSource({ tab: currentTab, collectionId: selectedCollectionId, fromScanPage: true });
              setScanModal('hidden');
              handleSearchLookup(w);
            }}
            onSaveExtractedWord={handleSaveExtractedWord}
          />
        </div>
      )}

      {isAddQuoteOpen && (
        <AddQuoteModal
          collections={collections}
          onClose={() => setIsAddQuoteOpen(false)}
          onSaveQuote={handleSaveWord}
          onCreateCollection={handleCreateCollection}
        />
      )}

      {isQuickAddOpen && (
        <QuickAddModal
          onClose={() => setIsQuickAddOpen(false)}
          onSearchLookup={handleSearchLookup}
          onOpenScanPage={() => openScanPage('scan')}
          onOpenPasteText={() => openScanPage('paste')}
          onOpenAddQuote={() => setIsAddQuoteOpen(true)}
          onOpenExpressions={() => {
            setActiveWordDetail(null);
            setIsCommuteMode(false);
            setCurrentTab('Expressions');
          }}
        />
      )}

      {isBookSearchOpen && (
        <BookSearchModal
          collections={collections.map((c) => ({ ...c, discoveriesCount: words.filter((w) => w.collectionId === c.id).length }))}
          onClose={() => setIsBookSearchOpen(false)}
          onSelectOrAddBook={handleSelectOrAddBook}
          onSetCurrentlyReading={handleSetCurrentlyReading}
        />
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] py-2.5 px-5 bg-stone-900 text-white rounded-full text-xs font-semibold shadow-xl animate-in fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFE042]"></span>
          <span>{toastMessage}</span>
          {toastAction && (
            <button
              type="button"
              onClick={() => {
                const action = toastAction;
                setToastAction(null);
                action.run();
              }}
              className="ml-1 py-1 px-3 rounded-full bg-[#FFE042] text-stone-900 font-bold hover:bg-[#F7D836]"
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
