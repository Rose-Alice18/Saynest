import React, { useState } from 'react';
import { WordEntry, Collection } from '../types';
import { X, Quote, Bookmark, Plus } from 'lucide-react';
import { useDictation, appendSpoken } from '../utils/useDictation';
import { DictateButton, DictationStatus } from './DictateButton';

interface AddQuoteModalProps {
  collections: Collection[];
  onClose: () => void;
  onSaveQuote: (entry: WordEntry) => void;
  /** Creates a collection and returns its id */
  onCreateCollection: (title: string, author?: string) => string;
}

const labelClass = 'text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1';
const inputClass =
  'w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]';

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  collections,
  onClose,
  onSaveQuote,
  onCreateCollection
}) => {
  // Starts empty; the book defaults to the one you're currently reading
  const current = collections[0];
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState(current?.author || '');
  const [book, setBook] = useState(current?.title || '');
  const [chapter, setChapter] = useState('');
  const [page, setPage] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState(current?.id || '');
  const [isCreatingCollection, setIsCreatingCollection] = useState(collections.length === 0);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');

  const dictation = useDictation((spoken) => setQuoteText((prev) => appendSpoken(prev, spoken)));

  const chooseCollection = (id: string) => {
    setSelectedCollectionId(id);
    const chosen = collections.find((c) => c.id === id);
    if (chosen) {
      setBook(chosen.title);
      setAuthor(chosen.author || '');
    }
  };

  const canSave = !!quoteText.trim() && (!isCreatingCollection || !!newCollectionTitle.trim());

  const handleSave = () => {
    if (!canSave) return;
    dictation.stop();

    const cleanAuthor = author.trim();
    const cleanBook = book.trim();
    const cleanChapter = chapter.trim();
    const cleanPage = page.trim();
    const collectionId = isCreatingCollection
      ? onCreateCollection(newCollectionTitle.trim(), cleanAuthor || undefined)
      : selectedCollectionId;

    const where = [cleanBook && ` in ${cleanBook}`, cleanChapter && `, chapter ${cleanChapter}`, cleanPage && `, page ${cleanPage}`]
      .filter(Boolean)
      .join('');

    const entry: WordEntry = {
      id: `quote-${Date.now()}`,
      word: quoteText.trim(),
      type: 'quote',
      phonetic: '',
      accents: [],
      quoteAuthor: cleanAuthor || undefined,
      quoteWork: cleanBook || undefined,
      meanings: [
        {
          partOfSpeech: 'quote',
          definitions: [
            {
              definition: `Quote by ${cleanAuthor || 'an unknown author'}${where}.`,
              example: quoteText.trim()
            }
          ]
        }
      ],
      dateAdded: new Date().toISOString(),
      collectionId,
      chapter: cleanChapter || undefined,
      source: {
        type: 'Book',
        title: cleanBook || undefined,
        author: cleanAuthor || undefined,
        chapter: cleanChapter || undefined,
        page: cleanPage || undefined
      },
      tags: ['quote'],
      isStarred: true
    };

    onSaveQuote(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 flex flex-col p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-stone-900" />
            <h3 className="font-bold text-stone-900 text-lg">Add a memorable quote</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quote-text" className={labelClass}>
              Quote
            </label>
            <textarea
              id="quote-text"
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Type the quote, or tap “Speak it” and read it aloud…"
              rows={4}
              className="w-full p-3.5 bg-white rounded-2xl border border-stone-200 text-sm font-serif italic text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            />
            <div className="flex items-center justify-between gap-2">
              <DictateButton listening={dictation.listening} onToggle={dictation.toggle} />
            </div>
            <DictationStatus listening={dictation.listening} interim={dictation.interim} error={dictation.error} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quote-author" className={labelClass}>Author</label>
              <input id="quote-author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Jane Austen" className={inputClass} />
            </div>
            <div>
              <label htmlFor="quote-book" className={labelClass}>Book</label>
              <input id="quote-book" type="text" value={book} onChange={(e) => setBook(e.target.value)} placeholder="e.g. Pride and Prejudice" className={inputClass} />
            </div>
            <div>
              <label htmlFor="quote-chapter" className={labelClass}>
                Chapter <span className="normal-case font-medium text-stone-400">(optional)</span>
              </label>
              <input id="quote-chapter" type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. 11" className={inputClass} />
            </div>
            <div>
              <label htmlFor="quote-page" className={labelClass}>
                Page <span className="normal-case font-medium text-stone-400">(optional)</span>
              </label>
              <input id="quote-page" type="text" inputMode="numeric" value={page} onChange={(e) => setPage(e.target.value)} placeholder="e.g. 126" className={inputClass} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="quote-collection" className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Add to collection
              </label>
              {collections.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isCreatingCollection && !newCollectionTitle) setNewCollectionTitle(book.trim());
                    setIsCreatingCollection(!isCreatingCollection);
                  }}
                  className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isCreatingCollection ? 'Choose existing' : 'New collection'}
                </button>
              )}
            </div>
            {isCreatingCollection ? (
              <input
                id="quote-collection"
                type="text"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
                placeholder="Name your new collection (e.g. Favourite lines)"
                className={inputClass}
              />
            ) : (
              <select
                id="quote-collection"
                value={selectedCollectionId}
                onChange={(e) => chooseCollection(e.target.value)}
                className={inputClass}
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3 bg-[#FFE042] hover:bg-[#F7D836] disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4 fill-stone-900" />
            <span>Save quote to library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
