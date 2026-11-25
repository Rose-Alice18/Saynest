import React, { useMemo, useState } from 'react';
import { X, ClipboardPaste, ListChecks, Check, Plus } from 'lucide-react';
import { Collection, WordEntry } from '../types';
import { parseWordList, ListedWord } from '../utils/wordList';

interface ImportListModalProps {
  /** Text shared or pasted in already (e.g. a note from Apple Notes) */
  initialText?: string;
  collections: Collection[];
  /** Saved words, to mark ones already in the library */
  savedWords: WordEntry[];
  onCreateCollection: (title: string) => string;
  onImport: (items: ListedWord[], collectionId: string) => void;
  onClose: () => void;
}

export const ImportListModal: React.FC<ImportListModalProps> = ({
  initialText = '',
  collections,
  savedWords,
  onCreateCollection,
  onImport,
  onClose
}) => {
  const [text, setText] = useState(initialText);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const items = useMemo(() => parseWordList(text), [text]);
  const savedSet = useMemo(() => new Set(savedWords.map((w) => w.word.toLowerCase())), [savedWords]);
  // Everything is ticked except words already saved
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const isTicked = (w: ListedWord) => !unticked.has(w.word) && !savedSet.has(w.word.toLowerCase());
  const chosen = items.filter(isTicked);
  const [collectionId, setCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState<string | null>(null);

  const toggle = (word: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });

  const pasteFromClipboard = async () => {
    setPasteError(null);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) setText(clip);
      else setPasteError('Nothing copied yet. Copy your list first, then tap Paste.');
    } catch {
      setPasteError('Your browser blocked pasting. Tap in the box below and choose Paste instead.');
    }
  };

  const handleSave = () => {
    if (!chosen.length) return;
    let target = collectionId;
    if (newCollectionName !== null && newCollectionName.trim()) target = onCreateCollection(newCollectionName.trim());
    onImport(chosen, target);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="w-full max-w-lg max-h-[92vh] bg-[#FFFDF7] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-stone-900" />
            <h3 id="import-title" className="font-bold text-stone-900 text-lg">Import a word list</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-4 space-y-4 overflow-y-auto">
          {!items.length ? (
            <>
              <p className="text-xs text-stone-600 leading-relaxed">
                Copy a list of words from Notes or anywhere else, one word per line. Numbers, bullets and meanings after a
                colon (<span className="font-semibold">callous : cruel and insensitive</span>) are understood.
              </p>
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <ClipboardPaste className="w-4 h-4 text-[#FFE042]" />
                Paste my list
              </button>
              {pasteError && <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{pasteError}</div>}
            </>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">
                {items.length} {items.length === 1 ? 'word' : 'words'} found · {chosen.length} selected
              </span>
              <button type="button" onClick={() => { setText(''); setUnticked(new Set()); }} className="text-stone-600 underline">
                Start over
              </button>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setUnticked(new Set()); }}
            placeholder={'1. Capricious\n2. Callous : cruel and insensitive\n3. Lethargy'}
            rows={items.length ? 3 : 6}
            aria-label="Your word list"
            className="w-full p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
          />

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((item) => {
                const already = savedSet.has(item.word.toLowerCase());
                const ticked = isTicked(item);
                return (
                  <li key={item.word}>
                    <label className={`flex items-start gap-3 p-2.5 rounded-xl border ${ticked ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-100'} ${already ? 'opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={ticked}
                        disabled={already}
                        onChange={() => toggle(item.word)}
                        className="mt-0.5 w-4 h-4 accent-stone-900 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="font-bold text-sm text-stone-900 font-serif-display">{item.word}</span>
                        {already && <span className="ml-2 text-[10px] font-semibold text-emerald-700">Already saved</span>}
                        {item.meaning && <span className="block text-[11px] text-stone-600 leading-snug mt-0.5">Your meaning: {item.meaning}</span>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-stone-200 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="import-collection" className="text-[11px] font-bold text-stone-600">Save to</label>
              {newCollectionName === null ? (
                <select
                  id="import-collection"
                  value={collectionId}
                  onChange={(e) => (e.target.value === '__new__' ? setNewCollectionName('') : setCollectionId(e.target.value))}
                  className="flex-1 min-w-0 p-1.5 bg-white rounded-lg border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                >
                  <option value="">No collection (just my library)</option>
                  {collections.map((c, i) => (
                    <option key={c.id} value={c.id}>{c.title}{i === 0 ? ' (reading now)' : ''}</option>
                  ))}
                  <option value="__new__">+ New collection…</option>
                </select>
              ) : (
                <div className="flex flex-1 min-w-0 items-center gap-1.5">
                  <input
                    autoFocus
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Name, e.g. Words from Notes"
                    aria-label="New collection name"
                    className="flex-1 min-w-0 p-1.5 bg-white rounded-lg border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
                  />
                  <button type="button" onClick={() => setNewCollectionName(null)} className="text-[11px] font-semibold text-stone-600 px-1">Cancel</button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!chosen.length || (newCollectionName !== null && !newCollectionName.trim())}
              className="w-full py-3 bg-[#FFE042] hover:bg-[#F7D836] disabled:opacity-50 text-stone-900 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {newCollectionName !== null ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              Save {chosen.length} {chosen.length === 1 ? 'word' : 'words'}
            </button>
            <p className="text-[11px] text-stone-500 text-center">
              SayNest then adds pronunciation, examples and full meanings in the background. Your own meanings are kept as your notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
