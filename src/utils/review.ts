import { WordEntry } from '../types';

// A small spaced-repetition scheduler. Each rating pushes the word's next
// review further out (or brings it back soon if it was forgotten), so the
// daily review only shows words that are actually due.

export type ReviewRating = 'again' | 'almost' | 'gotIt';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Due if the user hasn't switched reviews off and its review date has come */
export function isDue(word: WordEntry, now = Date.now()): boolean {
  const status = word.reviewStatus;
  if (status?.dueForReview === false) return false; // reminders turned off for this word
  if (!status?.nextReviewDate) return true; // never reviewed yet
  return new Date(status.nextReviewDate).getTime() <= now;
}

export function dueWords(words: WordEntry[], now = Date.now()): WordEntry[] {
  return words.filter((w) => w.type !== 'quote' && isDue(w, now));
}

/** Roughly 45 seconds per card, at least a minute */
export function estimateMinutes(cardCount: number): number {
  return Math.max(1, Math.ceil(cardCount * 0.75));
}

/** The word with its review schedule updated for this rating */
export function scheduleReview(word: WordEntry, rating: ReviewRating, now = Date.now()): WordEntry {
  const prev = word.reviewStatus;
  const repetitions = prev?.repetitions ?? 0;
  const interval = prev?.intervalDays ?? 0;

  let nextIntervalDays: number;
  let nextRepetitions: number;
  let nextDate: number;

  if (rating === 'again') {
    // Forgotten: start over and see it again shortly
    nextIntervalDays = 0;
    nextRepetitions = 0;
    nextDate = now + 10 * MINUTE;
  } else if (rating === 'almost') {
    // Shaky: keep roughly the same gap
    nextIntervalDays = Math.max(1, Math.round(interval * 1.2));
    nextRepetitions = repetitions;
    nextDate = now + nextIntervalDays * DAY;
  } else {
    // Remembered: 1 day, then 3, then growing by 2.5x each time
    nextIntervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(Math.max(interval, 1) * 2.5);
    nextRepetitions = repetitions + 1;
    nextDate = now + nextIntervalDays * DAY;
  }

  return {
    ...word,
    reviewStatus: {
      dueForReview: prev?.dueForReview ?? true,
      intervalDays: nextIntervalDays,
      repetitions: nextRepetitions,
      lastReviewed: new Date(now).toISOString(),
      nextReviewDate: new Date(nextDate).toISOString(),
    },
  };
}

/** "Today", "Yesterday" or "Earlier", worked out from the date rather than stored */
export function dateGroup(iso: string | undefined, now = new Date()): 'Today' | 'Yesterday' | 'Earlier' {
  if (!iso) return 'Earlier';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Earlier';
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startOfToday) return 'Today';
  if (d.getTime() >= startOfToday - DAY) return 'Yesterday';
  return 'Earlier';
}
