export type AccentType = 'British' | 'American' | 'Australian';

export interface AccentInfo {
  accent: AccentType;
  ipa: string;
  syllables?: string;
  audioUrl?: string;
  flag: string;
  langCode: string; // 'en-GB' | 'en-US' | 'en-AU'
}

export interface DefinitionItem {
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface MeaningGroup {
  partOfSpeech: string; // 'verb' | 'noun' | 'adjective' | 'transition' | 'phrase' | 'adverb';
  definitions: DefinitionItem[];
}

export interface NuanceGuide {
  bestUsedWhen?: string[];
  avoidWhen?: string[];
  formality?: 'Formal' | 'Neutral' | 'Informal' | 'Literary';
  cefr?: 'B1' | 'B2' | 'C1' | 'C2';
}

export interface RelatedExpression {
  phrase: string;
  type: string; // e.g. 'comparison' | 'addition' | 'contrast'
  relation?: string;
}

export interface WordSource {
  type: 'Book' | 'Article' | 'Speech' | 'Other';
  title?: string;
  author?: string;
  chapter?: string;
  page?: string;
  url?: string;
}

export interface WordEntry {
  id: string;
  word: string;
  type: 'word' | 'phrase' | 'transition' | 'quote';
  phonetic: string; // Primary IPA
  syllables?: string;
  accents: AccentInfo[];
  meanings: MeaningGroup[];
  nuance?: NuanceGuide;
  relatedExpressions?: RelatedExpression[];
  quoteAuthor?: string;
  quoteWork?: string;
  dateAdded: string; // ISO string
  groupDate?: 'Today' | 'Yesterday' | 'Earlier';
  source?: WordSource;
  collectionId?: string;
  userNote?: string;
  tags: string[];
  isStarred?: boolean;
  chapter?: string;
  searchedAt?: string;
  reviewStatus?: {
    dueForReview: boolean;
    intervalDays: number;
    repetitions: number;
    lastReviewed?: string;
    nextReviewDate?: string;
  };
}

export interface Collection {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImage?: string;
  accentColor?: string;
  discoveriesCount: number;
  totalChapters?: number;
  currentChapter?: number;
  pageCount?: number;
  isCurrentlyReading?: boolean;
}

export interface TransitionCategory {
  id: string;
  name: string;
  count: number;
  icon?: string;
  description: string;
  examples: WordEntry[];
}
