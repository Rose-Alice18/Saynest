import React, { useState } from 'react';
import { Search, Camera, FileText, Quote, Compass, X, Sparkles, ArrowRight } from 'lucide-react';

interface QuickAddModalProps {
  onClose: () => void;
  onSearchLookup: (word: string) => void;
  onOpenScanPage: () => void;
  onOpenPasteText: () => void;
  onOpenAddQuote: () => void;
  onOpenExpressions: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  onClose,
  onSearchLookup,
  onOpenScanPage,
  onOpenPasteText,
  onOpenAddQuote,
  onOpenExpressions
}) => {
  const [wordInput, setWordInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordInput.trim()) {
      onSearchLookup(wordInput.trim());
      onClose();
    }
  };

  const trendingWords = ['mimic', 'acquiesce', 'notwithstanding', 'ostensibly', 'by the same token', 'ephemeral'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#FFFDF7] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-lg">Add to your nest</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              autoFocus
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              placeholder="Type word, phrase or idiom..."
              className="w-full pl-10 pr-24 py-3.5 bg-white rounded-2xl border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FFE042]"
            />
            <button
              type="submit"
              disabled={!wordInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 py-1.5 px-3 bg-[#FFE042] disabled:opacity-50 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <span>Fetch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div>
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Try a word
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trendingWords.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  onSearchLookup(w);
                  onClose();
                }}
                className="py-1 px-2.5 bg-[#FAF6EC] hover:bg-[#FFE042] rounded-lg text-xs font-medium text-stone-800 transition-colors"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Alternative capture avenues */}
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanPage();
            }}
            className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/90 flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100/60 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">Scan a page</div>
              <div className="text-[11px] text-stone-500">Snap the page you're reading and pick out words</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPasteText();
            }}
            className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/90 flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100/60 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-800" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">Paste text</div>
              <div className="text-[11px] text-stone-500">Paste a passage and we'll pick out words to learn</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddQuote();
            }}
            className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/90 flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100/60 flex items-center justify-center shrink-0">
              <Quote className="w-4 h-4 text-rose-800" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">Add a quote</div>
              <div className="text-[11px] text-stone-500">Keep a line you loved from a book or talk</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenExpressions();
            }}
            className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/90 flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100/60 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">Explore expressions & transitions</div>
              <div className="text-[11px] text-stone-500">Rhetorical markers, addition, contrast & nuances</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
