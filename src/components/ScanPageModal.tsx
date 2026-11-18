import React, { useState } from 'react';
import { WordEntry } from '../types';
import { X, Search, Bookmark, Sparkles, BookOpen, FileText, Check, ArrowRight, Layers, CheckSquare, Square } from 'lucide-react';

interface ScanPageModalProps {
  onClose: () => void;
  onDefineWord: (word: string) => void;
  onSaveExtractedWord: (word: string, context: string, type?: 'word' | 'phrase' | 'transition') => void;
}

export interface PageDiscovery {
  id: string;
  word: string;
  type: 'word' | 'phrase' | 'transition';
  partOfSpeech: string;
  context: string;
  definition: string;
}

export const PAGE_DISCOVERIES: PageDiscovery[] = [
  {
    id: 'disc-1',
    word: 'obliged',
    type: 'word',
    partOfSpeech: 'verb',
    context: 'Elizabeth had been obliged, by the scarcity of gentlemen, to sit down for two dances.',
    definition: 'Bound by moral or social duty; compelled by circumstances.'
  },
  {
    id: 'disc-2',
    word: 'scarcity',
    type: 'word',
    partOfSpeech: 'noun',
    context: '... by the scarcity of gentlemen, to sit down for two dances.',
    definition: 'A state of being in short supply; insufficiency.'
  },
  {
    id: 'disc-3',
    word: 'in consequence',
    type: 'transition',
    partOfSpeech: 'transition',
    context: "... who was, in consequence of his being her sister's partner, to admire.",
    definition: 'As a direct result or outcome of what preceded.'
  },
  {
    id: 'disc-4',
    word: 'unassuming',
    type: 'word',
    partOfSpeech: 'adjective',
    context: 'His manners were easy and unassuming, and his conversation was sensible and animated.',
    definition: 'Modest and not pretentious or arrogant.'
  },
  {
    id: 'disc-5',
    word: 'sensible',
    type: 'word',
    partOfSpeech: 'adjective',
    context: '... and his conversation was sensible and animated.',
    definition: 'Possessing or displaying good sense and practical judgment.'
  },
  {
    id: 'disc-6',
    word: 'animated',
    type: 'word',
    partOfSpeech: 'adjective',
    context: '... his conversation was sensible and animated.',
    definition: 'Full of life, vigor or excitement; lively.'
  }
];

export const ScanPageModal: React.FC<ScanPageModalProps> = ({
  onClose,
  onDefineWord,
  onSaveExtractedWord,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'paste'>('scan');
  const [selectedWord, setSelectedWord] = useState('in consequence');
  const [selectedContext, setSelectedContext] = useState(
    "... who was, in consequence of his being her sister's partner, to admire."
  );
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [pastedText, setPastedText] = useState(
    "Elizabeth had been obliged, by the scarcity of gentlemen, to sit down for two dances; and during part of that time, she was engaged in conversation with a very agreeable young man, who was, in consequence of his being her sister's partner, to admire. His manners were easy and unassuming, and his conversation was sensible and animated."
  );
  const [activeThumbnail, setActiveThumbnail] = useState(0);

  const bookPages = [
    { title: 'Pride and Prejudice · p. 27', chapter: 'Chapter 3' },
    { title: 'Pride and Prejudice · p. 28', chapter: 'Chapter 3' },
    { title: 'Pride and Prejudice · p. 34', chapter: 'Chapter 4' },
    { title: 'Pride and Prejudice · p. 41', chapter: 'Chapter 5' }
  ];

  const handleWordClick = (word: string, context: string) => {
    setIsSelectAll(false);
    setSelectedWord(word);
    setSelectedContext(context);
  };

  const handleToggleSelectAll = () => {
    if (isSelectAll) {
      setIsSelectAll(false);
      setSelectedBatch([]);
    } else {
      setIsSelectAll(true);
      setSelectedBatch(PAGE_DISCOVERIES.map(d => d.word));
      setSelectedWord('in consequence');
      setSelectedContext("Elizabeth had been obliged... in consequence of his being her sister's partner...");
    }
  };

  const handleSaveCurrent = (type: 'word' | 'phrase' | 'transition' = 'word') => {
    if (isSelectAll) {
      // Batch save all selected
      PAGE_DISCOVERIES.forEach(d => {
        onSaveExtractedWord(d.word, d.context, d.type);
      });
      onClose();
    } else {
      const match = PAGE_DISCOVERIES.find(d => d.word.toLowerCase() === selectedWord.toLowerCase());
      onSaveExtractedWord(selectedWord, selectedContext, type || match?.type || 'word');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-[#FFFDF7]">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-lg font-serif-display">Scan & Discover</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Functional Select All Button */}
            <button
              onClick={handleToggleSelectAll}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                isSelectAll 
                  ? 'bg-stone-900 text-white shadow-xs' 
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {isSelectAll ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[#FFE042]" />
                  <span>Deselect all ({PAGE_DISCOVERIES.length})</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                  <span>Select all ({PAGE_DISCOVERIES.length})</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-2 bg-[#FAF6EC] border-b border-stone-200/60 px-6">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'scan' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Scan Book Page</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'paste' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Custom Text</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'scan' && (
            <>
              {/* Page Header */}
              <div className="flex items-center justify-between text-xs text-stone-500 italic pb-2 border-b border-stone-100">
                <span className="font-serif">{bookPages[activeThumbnail].title}</span>
                <span className="not-italic font-sans font-semibold text-stone-400">Page 27</span>
              </div>

              {/* Book Paper Simulation with click-to-discover words & phrases matching mockup Screen 5 */}
              <div className="relative p-6 bg-[#FCF8EE] rounded-2xl border border-stone-200 shadow-inner font-serif text-stone-800 text-base leading-relaxed tracking-normal">
                <p className="indent-4">
                  Elizabeth had been{' '}
                  <span
                    onClick={() => handleWordClick('obliged', 'Elizabeth had been obliged, by the scarcity of gentlemen, to sit down for two dances.')}
                    className={`cursor-pointer px-1 rounded transition-colors ${
                      isSelectAll || selectedWord === 'obliged' ? 'bg-[#FFE042] font-semibold text-stone-950' : 'hover:bg-amber-100'
                    }`}
                  >
                    obliged
                  </span>
                  , by the{' '}
                  <span
                    onClick={() => handleWordClick('scarcity', '... by the scarcity of gentlemen, to sit down for two dances.')}
                    className={`cursor-pointer px-1 rounded transition-colors ${
                      isSelectAll || selectedWord === 'scarcity' ? 'bg-[#FFE042] font-semibold text-stone-950' : 'hover:bg-amber-100'
                    }`}
                  >
                    scarcity
                  </span>{' '}
                  of gentlemen, to sit down for two dances; and during part of that time, she was engaged in conversation with a very agreeable young man, who was,{' '}
                  {/* Transition Phrase "in consequence" clickable together matching user request */}
                  <span
                    onClick={() => handleWordClick('in consequence', "... who was, in consequence of his being her sister's partner, to admire.")}
                    className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors inline-block ${
                      isSelectAll || selectedWord === 'in consequence' 
                        ? 'bg-[#FFE042] font-bold text-stone-950 ring-2 ring-stone-900/15 shadow-2xs' 
                        : 'hover:bg-amber-100 border-b-2 border-amber-400/80'
                    }`}
                    title="Click to select transition phrase 'in consequence'"
                  >
                    in consequence
                  </span>{' '}
                  of his being her sister’s partner, to admire.
                </p>
                <p className="mt-4 indent-4">
                  His manners were easy and{' '}
                  <span
                    onClick={() => handleWordClick('unassuming', 'His manners were easy and unassuming.')}
                    className={`cursor-pointer px-1 rounded transition-colors ${
                      isSelectAll || selectedWord === 'unassuming' ? 'bg-[#FFE042] font-semibold text-stone-950' : 'hover:bg-amber-100'
                    }`}
                  >
                    unassuming
                  </span>
                  , and his conversation was{' '}
                  <span
                    onClick={() => handleWordClick('sensible', '... his conversation was sensible and animated.')}
                    className={`cursor-pointer px-1 rounded transition-colors ${
                      isSelectAll || selectedWord === 'sensible' ? 'bg-[#FFE042] font-semibold text-stone-950' : 'hover:bg-amber-100'
                    }`}
                  >
                    sensible
                  </span>{' '}
                  and{' '}
                  <span
                    onClick={() => handleWordClick('animated', '... his conversation was sensible and animated.')}
                    className={`cursor-pointer px-1 rounded transition-colors ${
                      isSelectAll || selectedWord === 'animated' ? 'bg-[#FFE042] font-semibold text-stone-950' : 'hover:bg-amber-100'
                    }`}
                  >
                    animated
                  </span>
                  .
                </p>

                {/* Floating Action Menu matching Sheet 1, Screen 5: [ Define ] [ Save ] [ Save as phrase ] */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-stone-200/70">
                  <button
                    onClick={() => onDefineWord(selectedWord)}
                    className="py-1.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Define "{selectedWord}"</span>
                  </button>
                  <button
                    onClick={() => handleSaveCurrent(selectedWord.includes(' ') ? 'transition' : 'word')}
                    className="py-1.5 px-4 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => handleSaveCurrent('transition')}
                    className="py-1.5 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>Save as phrase</span>
                  </button>
                </div>
              </div>

              {/* Page Thumbnails Bar matching mockup */}
              <div>
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Book Pages</div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {bookPages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveThumbnail(idx)}
                      className={`w-16 h-20 rounded-lg border-2 p-1 text-[9px] flex flex-col justify-between shrink-0 font-serif text-stone-500 transition-all ${
                        activeThumbnail === idx
                          ? 'border-[#FFE042] bg-[#FAF6EC] shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="leading-tight text-center font-bold text-stone-700">p.{27 + idx}</div>
                      <div className="space-y-0.5 opacity-60">
                        <div className="h-0.5 bg-stone-400 rounded w-full"></div>
                        <div className="h-0.5 bg-stone-400 rounded w-4/5"></div>
                        <div className="h-0.5 bg-stone-400 rounded w-full"></div>
                      </div>
                      <div className="text-[8px] text-center text-stone-400 font-sans">Ch. {idx < 2 ? '3' : idx + 2}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Paste excerpt, book passage, or article paragraph
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste any English excerpt here..."
                  rows={6}
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FFE042] text-sm text-stone-800 leading-relaxed font-serif"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const words = pastedText
                      .replace(/[^\w\s-]/g, '')
                      .split(/\s+/)
                      .filter(w => w.length > 5);
                    if (words.length > 0) {
                      const first = words[0];
                      handleWordClick(first, pastedText.slice(0, 120) + '...');
                      setActiveTab('scan');
                    }
                  }}
                  className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFE042]" />
                  <span>Extract & Scan Vocabulary</span>
                </button>
              </div>
            </div>
          )}

          {/* Extracted Text Preview Section */}
          <div className="bg-[#FAF6EC] p-4 rounded-2xl border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Extracted context & selection</span>
              {isSelectAll && (
                <span className="text-emerald-700 font-bold">✓ All 6 items ready</span>
              )}
            </div>
            <div className="text-sm text-stone-800 font-medium italic">
              {isSelectAll 
                ? 'All 6 key discoveries on page 27: "obliged", "scarcity", "in consequence", "unassuming", "sensible", "animated"'
                : selectedContext}
            </div>
          </div>
        </div>

        {/* Bottom Primary CTA */}
        <div className="p-4 bg-[#FFFDF7] border-t border-stone-200/70">
          <button
            onClick={() => handleSaveCurrent(selectedWord.includes(' ') ? 'transition' : 'word')}
            className="w-full py-3.5 px-4 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 font-bold text-sm rounded-2xl shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4 fill-stone-900" />
            <span>
              {isSelectAll
                ? `Save all selected (6 discoveries to Pride & Prejudice)`
                : `Save selected ("${selectedWord}")`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
