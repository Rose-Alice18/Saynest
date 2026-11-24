import React, { useState } from 'react';
import { X, Search, Bookmark, Sparkles, BookOpen, FileText, Check, CheckSquare, Square, Loader2, Camera, ImageUp } from 'lucide-react';
import { prepareImageForUpload } from '../utils/imageResize';
import { useDictation, appendSpoken } from '../utils/useDictation';
import { DictateButton, DictationStatus } from './DictateButton';
import { CameraCapture } from './CameraCapture';

type ExtractMeta = { definition?: string; partOfSpeech?: string; chapter?: string; page?: string };

interface ScanPageModalProps {
  /** Which tab to open on: the sample page, or pasting your own text */
  initialTab?: 'scan' | 'paste';
  onClose: () => void;
  onDefineWord: (word: string) => void;
  onSaveExtractedWord: (
    word: string,
    context: string,
    type?: 'word' | 'phrase' | 'transition',
    meta?: ExtractMeta
  ) => void;
}

// What /api/scan returns for each word it picks out of pasted text
interface ExtractedWord {
  word: string;
  partOfSpeech?: string;
  briefMeaning?: string;
  contextSentence?: string;
  cefr?: string;
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
  initialTab = 'scan',
  onClose,
  onDefineWord,
  onSaveExtractedWord,
}) => {
  // "Scan a page" opens the photo tab; the old demo page is now "sample"
  const [activeTab, setActiveTab] = useState<'photo' | 'paste' | 'sample'>(
    initialTab === 'paste' ? 'paste' : 'photo'
  );

  // Words the AI picked out (from a photo or pasted text), and which are saved
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedWord[] | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [savedExtracted, setSavedExtracted] = useState<string[]>([]);

  // Photo tab
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  // Phones and tablets have a touch screen as their main pointer
  const [isTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Chapter / page printed on the scanned page, saved with each word
  const [photoMeta, setPhotoMeta] = useState<{ chapter?: string; page?: string }>({});

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setExtracted(null);
    setSavedExtracted([]);
    setPhotoMeta({});
    setIsReadingPhoto(true);
    try {
      const prepared = await prepareImageForUpload(file);
      setPhotoPreview(prepared.dataUrl);
      const res = await fetch('/api/scan-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: prepared.data, mimeType: prepared.mimeType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't read that photo. Please try again.");

      const items: ExtractedWord[] = data.extractedWords || [];
      setExtracted(items);
      setPhotoMeta({ chapter: data.chapter, page: data.pageNumber });
      // Put what we read into the paste box, so misread words can be fixed
      if (data.pageText) setPastedText(data.pageText);
      if (!data.pageText) {
        setPhotoError("We couldn't find any text in that photo. Make sure the page fills the frame and is in focus.");
      } else if (!items.length) {
        setPhotoError('We read the page but found no words worth learning on it.');
      }
    } catch (err: any) {
      setPhotoError(err?.message || "Couldn't read that photo. Please try again.");
    } finally {
      setIsReadingPhoto(false);
    }
  };

  const handleExtract = async () => {
    if (!pastedText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    setExtracted(null);
    setSavedExtracted([]);
    setPhotoMeta({}); // edited text isn't tied to the photo's page any more
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: ExtractedWord[] = (data.extractedWords || []).filter((w: ExtractedWord) => w?.word);
      setExtracted(items);
      if (!items.length) setExtractError("We couldn't find words worth learning in that text. Try a longer passage.");
    } catch {
      setExtractError("Couldn't reach SayNest to read that text. Check your connection and try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const saveExtracted = (item: ExtractedWord) => {
    onSaveExtractedWord(item.word, item.contextSentence || '', item.word.includes(' ') ? 'phrase' : 'word', {
      definition: item.briefMeaning,
      partOfSpeech: item.partOfSpeech,
      chapter: photoMeta.chapter,
      page: photoMeta.page,
    });
    setSavedExtracted((prev) => [...prev, item.word]);
  };
  const [selectedWord, setSelectedWord] = useState('in consequence');
  const [selectedContext, setSelectedContext] = useState(
    "... who was, in consequence of his being her sister's partner, to admire."
  );
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [pastedText, setPastedText] = useState('');
  // Read a passage aloud instead of typing it
  const dictation = useDictation((spoken) => setPastedText((prev) => appendSpoken(prev, spoken)));
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

  // The sample page is page 27, chapter 3, so its words carry that location
  const samplePageMeta: ExtractMeta = { chapter: '3', page: '27' };

  const handleSaveCurrent = (type: 'word' | 'phrase' | 'transition' = 'word') => {
    if (isSelectAll) {
      // Batch save all selected
      PAGE_DISCOVERIES.forEach(d => {
        onSaveExtractedWord(d.word, d.context, d.type, samplePageMeta);
      });
      onClose();
    } else {
      const match = PAGE_DISCOVERIES.find(d => d.word.toLowerCase() === selectedWord.toLowerCase());
      onSaveExtractedWord(selectedWord, selectedContext, type || match?.type || 'word', samplePageMeta);
      onClose();
    }
  };

  // Words found in a photo or pasted text, each with Define / Save
  const resultsList = extracted && extracted.length > 0 && (
    <div className="space-y-2">
      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
        Words worth learning ({extracted.length})
        {(photoMeta.chapter || photoMeta.page) && (
          <span className="normal-case font-semibold text-stone-400">
            {' '}· {photoMeta.chapter && `Chapter ${photoMeta.chapter}`}
            {photoMeta.chapter && photoMeta.page && ', '}
            {photoMeta.page && `page ${photoMeta.page}`}
          </span>
        )}
      </div>
      {extracted.map((item) => {
        const isSaved = savedExtracted.includes(item.word);
        return (
          <div key={item.word} className="p-3 bg-white rounded-2xl border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-bold font-serif-display text-stone-950 truncate">{item.word}</span>
                {item.partOfSpeech && (
                  <span className="text-[11px] text-stone-500 capitalize">{item.partOfSpeech}</span>
                )}
                {item.cefr && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{item.cefr}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onDefineWord(item.word)}
                  className="py-1 px-2.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-[11px] font-bold text-stone-800"
                >
                  Define
                </button>
                <button
                  onClick={() => saveExtracted(item)}
                  disabled={isSaved}
                  className={`py-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                    isSaved ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FFE042] hover:bg-[#F7D836] text-stone-900'
                  }`}
                >
                  {isSaved ? <><Check className="w-3 h-3" /> Saved</> : <><Bookmark className="w-3 h-3" /> Save</>}
                </button>
              </div>
            </div>
            {item.briefMeaning && <p className="text-xs text-stone-700">{item.briefMeaning}</p>}
            {item.contextSentence && (
              <p className="text-[11px] text-stone-500 italic font-serif">"{item.contextSentence}"</p>
            )}
          </div>
        );
      })}
    </div>
  );

  const tabButton = (tab: typeof activeTab, Icon: React.ElementType, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
        activeTab === tab ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-[#FFFDF7] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-[#FFFDF7]">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-lg font-serif-display">
              {activeTab === 'photo' ? 'Scan a page' : activeTab === 'paste' ? 'Find words in text' : 'Sample page'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Select All applies to the sample page only */}
            {activeTab === 'sample' && <button
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
            </button>}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-1 py-2 bg-[#FAF6EC] border-b border-stone-200/60 px-6">
          {tabButton('photo', Camera, 'Scan a photo')}
          {tabButton('paste', FileText, 'Paste text')}
          {tabButton('sample', BookOpen, 'Sample page')}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'photo' && (
            <div className="space-y-4">
              {/* On phones, capture="environment" opens the back camera app.
                  Laptops ignore it and show a file picker, so they get a
                  live webcam view instead. The second input picks an existing photo. */}
              {showCamera ? (
                <CameraCapture
                  onCapture={(file) => { setShowCamera(false); handlePhoto(file); }}
                  onCancel={() => setShowCamera(false)}
                />
              ) : (
              <div className="grid grid-cols-2 gap-2">
                {isTouchDevice ? (
                  <label className="cursor-pointer p-4 bg-[#FFE042] hover:bg-[#F7D836] rounded-2xl flex flex-col items-center gap-1.5 text-stone-900 transition-transform active:scale-95">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-bold">Take a photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      disabled={isReadingPhoto}
                      onChange={(e) => { handlePhoto(e.target.files?.[0]); e.target.value = ''; }}
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={isReadingPhoto}
                    className="p-4 bg-[#FFE042] hover:bg-[#F7D836] disabled:opacity-50 rounded-2xl flex flex-col items-center gap-1.5 text-stone-900 transition-transform active:scale-95"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-bold">Take a photo</span>
                  </button>
                )}
                <label className="cursor-pointer p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center gap-1.5 text-stone-900 transition-transform active:scale-95">
                  <ImageUp className="w-6 h-6" />
                  <span className="text-xs font-bold">Choose a photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isReadingPhoto}
                    onChange={(e) => { handlePhoto(e.target.files?.[0]); e.target.value = ''; }}
                  />
                </label>
              </div>
              )}

              {!photoPreview && !isReadingPhoto && !showCamera && (
                <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                  Snap the page you're reading. Keep it flat, well lit and filling the frame. We'll read it and pick out
                  words worth learning.
                </p>
              )}

              {photoPreview && (
                <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-stone-200">
                  <img src={photoPreview} alt="Your page" className="w-14 h-18 object-cover rounded-lg border border-stone-200" />
                  <div className="text-xs text-stone-600 flex-1">
                    {isReadingPhoto ? (
                      <span className="flex items-center gap-2 font-semibold text-stone-800">
                        <Loader2 className="w-4 h-4 animate-spin" /> Reading your page…
                      </span>
                    ) : extracted?.length ? (
                      <>
                        Page read.{' '}
                        <button onClick={() => setActiveTab('paste')} className="underline font-semibold text-stone-800">
                          See or fix the text
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {photoError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  {photoError}
                </div>
              )}

              {resultsList}
            </div>
          )}
          {activeTab === 'sample' && (
            <>
              {/* Be upfront that this is a demo page, not a camera scan */}
              <div className="text-[11px] text-stone-600 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5">
                This is a <strong>sample page</strong> to show how scanning works: tap a highlighted word.
                To use your own reading, choose <strong>Scan a photo</strong> or <strong>Paste text</strong>.
              </div>

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
                  Paste, type or read out a passage
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste or type a passage here, or tap “Speak it” and read it aloud…"
                  rows={6}
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FFE042] text-sm text-stone-800 leading-relaxed font-serif"
                />
                <div className="mt-2">
                  <DictationStatus listening={dictation.listening} interim={dictation.interim} error={dictation.error} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <DictateButton listening={dictation.listening} onToggle={dictation.toggle} />
                <button
                  onClick={() => { dictation.stop(); handleExtract(); }}
                  disabled={isExtracting || !pastedText.trim()}
                  className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {isExtracting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFE042]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#FFE042]" />
                  )}
                  <span>{isExtracting ? 'Reading your text…' : 'Find words to learn'}</span>
                </button>
              </div>

              {extractError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  {extractError}
                </div>
              )}

              {/* Words picked out of the pasted (or scanned) text */}
              {resultsList}
            </div>
          )}

          {/* Extracted Text Preview Section (sample page) */}
          {activeTab === 'sample' && <div className="bg-[#FAF6EC] p-4 rounded-2xl border border-stone-200/80">
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
          </div>}
        </div>

        {/* Bottom Primary CTA (sample page; pasted words have their own Save buttons) */}
        {activeTab === 'sample' && <div className="p-4 bg-[#FFFDF7] border-t border-stone-200/70">
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
        </div>}
      </div>
    </div>
  );
};
