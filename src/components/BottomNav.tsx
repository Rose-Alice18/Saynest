import React from 'react';
import { Home, Bookmark, Plus, Layers, Sparkles, BookOpen } from 'lucide-react';

export type MainTab = 'Home' | 'Library' | 'Collections' | 'Review' | 'Expressions';

interface BottomNavProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onQuickAdd: () => void;
  reviewDueCount?: number;
}

// Phone navigation: all five sections as equal tabs, so every screen is one
// tap away (Expressions used to be missing). "Add" is a floating button
// above the bar rather than a sixth, cramped tab.
const TABS: { tab: MainTab; label: string; icon: React.ElementType; aria: string }[] = [
  { tab: 'Home', label: 'Home', icon: Home, aria: 'Home screen' },
  { tab: 'Library', label: 'Library', icon: Bookmark, aria: 'Your vocabulary library' },
  { tab: 'Collections', label: 'Books', icon: Layers, aria: 'Book collections' },
  { tab: 'Expressions', label: 'Phrases', icon: BookOpen, aria: 'Expressions and transitions' },
  { tab: 'Review', label: 'Review', icon: Sparkles, aria: 'Review flashcards' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onQuickAdd,
  reviewDueCount = 0
}) => {
  return (
    <>
      {/* Floating Add button, above the bar on the right */}
      <button
        type="button"
        onClick={onQuickAdd}
        className="md:hidden fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full bg-[#FFE042] hover:bg-[#F7D836] shadow-lg flex items-center justify-center text-stone-950 transition-transform active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        aria-label="Add a word, scan a page or paste text"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF7]/95 backdrop-blur-md border-t border-stone-200/80 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
          {TABS.map(({ tab, label, icon: Icon, aria }) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                aria-label={aria}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                  isActive ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight mt-1">{label}</span>
                {isActive && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[#FFE042] rounded-full" />}
                {tab === 'Review' && reviewDueCount > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-1.5 min-w-4 h-4 px-1 bg-[#FFE042] text-stone-950 text-[9px] font-bold rounded-full flex items-center justify-center shadow-2xs">
                    {reviewDueCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
