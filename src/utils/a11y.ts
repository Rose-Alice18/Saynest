import type React from 'react';

/**
 * Props that make a clickable card (a <div> holding other buttons, so it
 * can't itself be a <button>) work from the keyboard: reachable with Tab,
 * opened with Enter or Space, and announced as a button by screen readers.
 *
 * Give the card "focus-visible:ring-2 focus-visible:ring-stone-900" (or
 * similar) so keyboard users can see where they are.
 */
export function clickableProps(onActivate: () => void, label?: string) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (e: React.KeyboardEvent) => {
      // Keys pressed on a button inside the card belong to that button
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
