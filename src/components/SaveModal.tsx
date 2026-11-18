import React, { useState } from 'react';
import { WordEntry, Collection } from '../types';
import { Volume2, X, Plus, BookOpen, FileText, Mic, Globe } from 'lucide-react';
import { speakWord } from '../utils/speech';
import { BookCover } from './BookCover';

interface SaveModalProps {
  word: WordEntry;
  collections: Collection[];
  onClose: () => void;
  onSave: (savedWord: WordEntry) => void;
  onCreateCollection: (name: string) => string; // returns new collection ID
}

export const SaveModal: React.FC<SaveModalProps> = ({
  word,
  collections,
  onClose,
  onSave,
  onCreateCollection
}) => {
  const [personalNote, setPersonalNote] = useState(word.userNote || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState(word.collectionId || collections[0]?.id || '');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [sourceType, setSourceType] = useState<'Book' | 'Article' | 'Speech' | 'Other'>(word.source?.type || 'Book');
  const [sourceTitle, setSourceTitle] = useState(word.source?.title || 'Pride and Prejudice');
  const [sourceAuthor, setSourceAuthor] = useState(word.source?.author || 'Jane Austen');
  const [chapter, setChapter] = useState(word.source?.chapter || '14');
  const [page, setPage] = useState(word.source?.page || '126');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(word.tags || ['useful', 'literature']);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    speakWord(word.word, 'British', 1.0, undefined, () => setIsPlayingAudio(true), () => setIsPlayingAudio(false));
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    let finalCollectionId = selectedCollectionId;
    if (isCreatingCollection && newCollectionTitle.trim()) {
      finalCollectionId = onCreateCollection(newCollectionTitle.trim());
    }

    const updated: WordEntry = {
      ...word,
      userNote: personalNote.trim() || undefined,
      collectionId: finalCollectionId,
      tags,
      source: {
        type: sourceType,
        title: sourceTitle.trim() || undefined,
        author: sourceAuthor.trim() || undefined,
        chapter: chapter.trim() || undefined,
        page: page.trim() || undefined
      },
      reviewStatus: {
        dueForReview: reminderEnabled,
        intervalDays: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString().split('T')[0]
      }
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#FFFDF7] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200/80 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-[#FFFDF7]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">Save to library</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-800">
          {/* Word Mini Preview Card */}
          <div className="bg-[#FAF6EC] p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                  isPlayingAudio ? 'bg-[#FFE042] scale-105 shadow-sm' : 'bg-[#FFE042] hover:bg-[#FAD830]'
                }`}
                aria-label="Listen to pronunciation"
              >
                <Volume2 className="w-5 h-5 text-stone-900" />
              </button>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-bold font-serif-display text-stone-900">{word.word}</h3>
                  <span className="text-xs text-stone-500 font-medium">
                    {word.meanings.map(m => m.partOfSpeech).join(' · ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <span className="font-mono">{word.phonetic || word.accents[0]?.ipa}</span>
                  <span>·</span>
                  <span>🇬🇧 British English</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add a Personal Note */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Add a personal note <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="E.g. Remember: often used when... My own example sentence..."
              rows={3}
              className="w-full p-3.5 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FFE042] focus:border-stone-400 text-stone-800 placeholder-stone-400 resize-none transition-all"
            />
          </div>

          {/* Add to Collection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Add to collection
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCollection(!isCreatingCollection)}
                className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {isCreatingCollection ? 'Choose existing' : 'New collection'}
              </button>
            </div>

            {isCreatingCollection ? (
              <input
                type="text"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
                placeholder="Name your new collection (e.g. Modernist Poetry)..."
                className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FFE042] text-stone-800"
              />
            ) : (
              <select
                value={selectedCollectionId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedCollectionId(newId);
                  const matched = collections.find(c => c.id === newId);
                  if (matched) {
                    setSourceTitle(matched.title);
                    if (matched.author) setSourceAuthor(matched.author);
                  }
                }}
                className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FFE042] text-stone-800 font-medium"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title} ({col.discoveriesCount} discoveries)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Source Selector (Book, Article, Speech, Other) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Source <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(['Book', 'Article', 'Speech', 'Other'] as const).map((type) => {
                const isActive = sourceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSourceType(type)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-[#FFE042] text-stone-900 font-semibold shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    {type === 'Book' && <BookOpen className="w-3.5 h-3.5" />}
                    {type === 'Article' && <FileText className="w-3.5 h-3.5" />}
                    {type === 'Speech' && <Mic className="w-3.5 h-3.5" />}
                    {type === 'Other' && <Globe className="w-3.5 h-3.5" />}
                    {type}
                  </button>
                );
              })}
            </div>

            {sourceType === 'Book' && (
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-3">
                  <BookCover
                    title={sourceTitle}
                    author={sourceAuthor}
                    coverImage={collections.find(c => c.id === selectedCollectionId)?.coverImage}
                    size="sm"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="Book title..."
                      className="w-full text-sm font-semibold text-stone-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={sourceAuthor}
                      onChange={(e) => setSourceAuthor(e.target.value)}
                      placeholder="Author name..."
                      className="w-full text-xs text-stone-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                  <div>
                    <label className="text-[11px] text-stone-500 font-medium block mb-1">Chapter</label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g. 14"
                      className="w-full p-2 bg-[#FAF6EC] rounded-lg text-xs font-medium text-stone-800 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#FFE042]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-500 font-medium block mb-1">Page</label>
                    <input
                      type="text"
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      placeholder="e.g. 126"
                      className="w-full p-2 bg-[#FAF6EC] rounded-lg text-xs font-medium text-stone-800 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#FFE042]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Tags <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium text-stone-700"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="e.g. useful, essay, formal, speaking..."
                className="flex-1 p-2.5 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Set a Review Reminder */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-stone-200">
            <div>
              <div className="text-xs font-bold text-stone-900">Set a review reminder</div>
              <div className="text-[11px] text-stone-500">Add to spaced-repetition commute and flashcard review</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFE042]" />
            </label>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 sm:p-6 border-t border-stone-200/80 bg-[#FFFDF7]">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 px-4 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 font-bold text-base rounded-2xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Save to library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
