import React, { useState } from 'react';
import { WordEntry, Collection } from '../types';
import { X, Quote, Bookmark } from 'lucide-react';

interface AddQuoteModalProps {
  collections: Collection[];
  onClose: () => void;
  onSaveQuote: (entry: WordEntry) => void;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  collections,
  onClose,
  onSaveQuote
}) => {
  const [quoteText, setQuoteText] = useState(
    '“I declare after all there is no enjoyment like reading!”'
  );
  const [author, setAuthor] = useState('Jane Austen');
  const [work, setWork] = useState('Pride and Prejudice, Chapter 11');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');

  const handleSave = () => {
    if (!quoteText.trim()) return;

    const entry: WordEntry = {
      id: `quote-${Date.now()}`,
      word: quoteText.trim(),
      type: 'quote',
      phonetic: '',
      accents: [],
      quoteAuthor: author.trim() || undefined,
      quoteWork: work.trim() || undefined,
      meanings: [
        {
          partOfSpeech: 'quote',
          definitions: [
            {
              definition: `Quote by ${author.trim() || 'Unknown'}${work ? ` in ${work.trim()}` : ''}.`,
              example: quoteText.trim()
            }
          ]
        }
      ],
      dateAdded: new Date().toISOString(),
      groupDate: 'Today',
      collectionId: selectedCollectionId,
      source: {
        type: 'Book',
        title: work.trim() || undefined,
        author: author.trim() || undefined
      },
      tags: ['quote', 'literature', 'wisdom'],
      isStarred: true
    };

    onSaveQuote(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-stone-900" />
            <h3 className="font-bold text-stone-900 text-lg">Add a memorable quote</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
              Quote Text
            </label>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Enter quote..."
              rows={4}
              className="w-full p-3.5 bg-white rounded-2xl border border-stone-200 text-sm font-serif italic text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Jane Austen"
                className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Work / Chapter
              </label>
              <input
                type="text"
                value={work}
                onChange={(e) => setWork(e.target.value)}
                placeholder="e.g. Chapter 11"
                className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
              Add to Collection
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            >
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4 fill-stone-900" />
            <span>Save Quote to Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
