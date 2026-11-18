import React, { useState } from 'react';
import { WordEntry } from '../types';
import { X, Download, Printer, FileSpreadsheet, Layers, Check, Sparkles } from 'lucide-react';
import { exportToAnki, exportToCsv, printStudyCards } from '../utils/exportDeck';

interface ExportModalProps {
  title: string;
  words: WordEntry[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ title, words, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleAnkiExport = () => {
    exportToAnki(words, title);
    setDownloadSuccess('Anki deck downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handlePrint = () => {
    printStudyCards(title, words);
  };

  const handleCsvExport = () => {
    exportToCsv(words, title);
    setDownloadSuccess('CSV spreadsheet downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        className="w-full max-w-md bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-[#FAF6EC]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFE042] flex items-center justify-center text-stone-900 shadow-2xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif-display">Export & Print Flashcards</h3>
              <p className="text-[11px] text-stone-500 font-sans">{words.length} items from &ldquo;{title}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success toast if triggered */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Options */}
        <div className="p-6 space-y-3">
          {/* Anki Deck */}
          <button
            onClick={handleAnkiExport}
            className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#FAF6EC] border border-stone-200 hover:border-amber-300 transition-all shadow-2xs group flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-[#FFE042] text-amber-900 flex items-center justify-center shrink-0 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-sm">Export to Anki Deck (.txt)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Pre-formatted tab-separated deck for Anki (Desktop, iPhone, Android). Includes word cards, IPA phonetics, accents, and example sentences.
              </p>
            </div>
          </button>

          {/* Printable Study Cards / Save as PDF */}
          <button
            onClick={handlePrint}
            className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#FAF6EC] border border-stone-200 hover:border-amber-300 transition-all shadow-2xs group flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-[#FFE042] text-stone-800 flex items-center justify-center shrink-0 transition-colors">
              <Printer className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-sm">Print Flashcards / Save as PDF</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                  Print Ready
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Opens clean printable study sheet with cut lines, definitions, and examples. Choose &ldquo;Save as PDF&rdquo; in your browser print prompt.
              </p>
            </div>
          </button>

          {/* CSV Spreadsheet */}
          <button
            onClick={handleCsvExport}
            className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#FAF6EC] border border-stone-200 hover:border-amber-300 transition-all shadow-2xs group flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-[#FFE042] text-emerald-800 flex items-center justify-center shrink-0 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-stone-900 text-sm block">Export to CSV Spreadsheet (.csv)</span>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Formatted CSV table for Microsoft Excel, Google Sheets, or Notion database import.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF6EC]/70 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-500">
          <span>Formatted with SayNest linguistic schema</span>
          <button
            onClick={onClose}
            className="py-1.5 px-3.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
