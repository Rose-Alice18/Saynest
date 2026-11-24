import React, { useState } from 'react';
import { Collection } from '../types';
import { BookCover } from './BookCover';
import { Search, Mic, MicOff, BookOpen, Check, X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { recognitionErrorMessage, UNSUPPORTED_MESSAGE } from '../utils/speechCheck';

interface BookSearchModalProps {
  collections: Collection[];
  onClose: () => void;
  onSelectOrAddBook: (book: {
    title: string;
    author: string;
    coverUrl?: string;
    pageCount?: number;
    setAsCurrentlyReading: boolean;
  }) => void;
  onSetCurrentlyReading: (collectionId: string) => void;
}

interface FetchedBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  year?: number | string;
  pageCount?: number;
}

export const BookSearchModal: React.FC<BookSearchModalProps> = ({
  collections,
  onClose,
  onSelectOrAddBook,
  onSetCurrentlyReading
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchResults, setSearchResults] = useState<FetchedBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<FetchedBook | null>(null);
  const [setAsCurrent, setSetAsCurrent] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'existing'>('search');

  // Popular classics to discover with 1 click
  const quickSuggestions = [
    'The Great Gatsby',
    '1984',
    'To Kill a Mockingbird',
    'Jane Eyre',
    'Frankenstein',
    'Wuthering Heights'
  ];

  const searchBooksOnline = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedBook(null);

    try {
      // 1. Query server endpoint
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.books) && data.books.length > 0) {
          setSearchResults(data.books);
          setSelectedBook(data.books[0]);
          setIsSearching(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Server book search failed, trying direct OpenLibrary:', e);
    }

    // 2. Direct OpenLibrary client fallback
    try {
      const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery.trim())}&limit=6`);
      if (olRes.ok) {
        const olData = await olRes.json();
        if (olData.docs && olData.docs.length > 0) {
          const formatted: FetchedBook[] = olData.docs.map((doc: any) => ({
            id: doc.key || `ol-${Date.now()}-${Math.random()}`,
            title: doc.title,
            author: Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || 'Unknown Author'),
            coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
            year: doc.first_publish_year,
            pageCount: doc.number_of_pages_median || 280
          }));
          setSearchResults(formatted);
          setSelectedBook(formatted[0]);
          setIsSearching(false);
          return;
        }
      }
    } catch (olErr) {
      console.warn('Direct OpenLibrary failed:', olErr);
    }

    // 3. Guaranteed manual fallback
    const fallbackBook: FetchedBook = {
      id: `manual-${Date.now()}`,
      title: searchQuery.trim(),
      author: 'Unknown author',
      coverUrl: undefined,
      pageCount: 300
    };
    setSearchResults([fallbackBook]);
    setSelectedBook(fallbackBook);
    setIsSearching(false);
  };

  const [voiceError, setVoiceError] = useState<string | null>(null);

  const handleVoiceInput = () => {
    setVoiceError(null);
    // This used to search a random classic novel when voice wasn't supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError(UNSUPPORTED_MESSAGE);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setQuery(text);
        setIsVoiceListening(false);
        searchBooksOnline(text);
      };
      recognition.onerror = (e: any) => {
        setIsVoiceListening(false);
        if (e?.error !== 'aborted') setVoiceError(recognitionErrorMessage(e?.error));
      };
      recognition.onend = () => setIsVoiceListening(false);
      recognition.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  const handleConfirm = () => {
    if (selectedBook) {
      onSelectOrAddBook({
        title: selectedBook.title,
        author: selectedBook.author,
        coverUrl: selectedBook.coverUrl,
        pageCount: selectedBook.pageCount,
        setAsCurrentlyReading: setAsCurrent
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-[#FFFDF7]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-stone-900" />
            <h3 className="font-bold text-stone-900 text-lg">Reading Collections</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-[#FAF6EC] border-b border-stone-200/70">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'search' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Fetch Book Online</span>
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'existing' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Existing Books ({collections.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'search' ? (
            <>
              {/* Search bar with Voice Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Type or say book title & author
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchBooksOnline(query);
                      }
                    }}
                    placeholder="e.g. The Great Gatsby, 1984, Jane Eyre..."
                    className="w-full pl-10 pr-24 py-3 bg-white rounded-2xl border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isVoiceListening ? 'bg-rose-500 text-white animate-pulse' : 'text-stone-500 hover:bg-stone-100'
                      }`}
                      title="Speak book title"
                    >
                      {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => searchBooksOnline(query)}
                      disabled={!query.trim() || isSearching}
                      className="py-1 px-2.5 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find'}
                    </button>
                  </div>
                </div>
                {isVoiceListening && (
                  <div className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Listening... Speak the title and author now.
                  </div>
                )}
                {voiceError && !isVoiceListening && (
                  <div role="alert" className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900">
                    {voiceError}
                  </div>
                )}
              </div>

              {/* Quick suggestions */}
              <div>
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Or pick a classic to fetch cover:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((bookTitle) => (
                    <button
                      key={bookTitle}
                      type="button"
                      onClick={() => {
                        setQuery(bookTitle);
                        searchBooksOnline(bookTitle);
                      }}
                      className="py-1 px-2.5 bg-[#FAF6EC] hover:bg-[#FFE042] rounded-lg text-xs font-medium text-stone-800 transition-colors"
                    >
                      {bookTitle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results List with Covers */}
              {isSearching && (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-700 mx-auto" />
                  <div className="text-xs text-stone-600 font-medium">
                    Fetching authentic book cover online...
                  </div>
                </div>
              )}

              {searchResults.length > 0 && !isSearching && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Online Matches ({searchResults.length})
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {searchResults.map((book) => {
                      const isSelected = selectedBook?.id === book.id;
                      return (
                        <div
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#FAF6EC] border-[#FFE042] ring-2 ring-[#FFE042]/50 shadow-xs'
                              : 'bg-white hover:bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Book cover preview */}
                            <BookCover
                              title={book.title}
                              author={book.author}
                              coverImage={book.coverUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-stone-900 font-serif-display truncate">
                                {book.title}
                              </div>
                              <div className="text-xs text-stone-600 truncate">{book.author}</div>
                              {book.year && (
                                <div className="text-[11px] text-stone-400">
                                  {book.year} {book.pageCount ? `· ~${book.pageCount} pages` : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-[#FFE042] flex items-center justify-center text-stone-950 font-bold">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Book Preview & Confirmation */}
              {selectedBook && (
                <div className="bg-[#FAF6EC] p-4 rounded-2xl border border-stone-200/90 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-4">
                    <BookCover
                      title={selectedBook.title}
                      author={selectedBook.author}
                      coverImage={selectedBook.coverUrl}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        Cover & Details Ready
                      </div>
                      <div className="font-bold text-base text-stone-950 font-serif-display truncate">
                        {selectedBook.title}
                      </div>
                      <div className="text-xs text-stone-600">{selectedBook.author}</div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-stone-200 text-xs">
                    <input
                      type="checkbox"
                      checked={setAsCurrent}
                      onChange={(e) => setSetAsCurrent(e.target.checked)}
                      className="accent-stone-900 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-stone-800">
                      Set as my "Currently reading" book on Home screen
                    </span>
                  </label>
                </div>
              )}
            </>
          ) : (
            /* Existing Collections View */
            <div className="space-y-3">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Click a book to make it "Currently reading":
              </div>
              <div className="space-y-2.5">
                {collections.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => {
                      onSetCurrentlyReading(col.id);
                      onClose();
                    }}
                    className="p-3.5 bg-white hover:bg-[#FAF6EC] rounded-2xl border border-stone-200/90 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <BookCover
                        collectionId={col.id}
                        title={col.title}
                        author={col.author}
                        coverImage={col.coverImage}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-stone-950 font-serif-display truncate">
                          {col.title}
                        </div>
                        <div className="text-xs text-stone-500">{col.author}</div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {col.discoveriesCount} discoveries
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-stone-600 group-hover:text-stone-950 flex items-center gap-1 shrink-0">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'search' && (
          <div className="p-4 bg-[#FFFDF7] border-t border-stone-200/80">
            <button
              onClick={handleConfirm}
              disabled={!selectedBook}
              className="w-full py-3.5 px-4 bg-[#FFE042] disabled:opacity-50 hover:bg-[#F7D836] text-stone-900 font-bold text-sm rounded-2xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Attach Book & Add to My Nest</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
