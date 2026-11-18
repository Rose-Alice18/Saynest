import React from 'react';
import { Home, Bookmark, Plus, Layers, Sparkles } from 'lucide-react';

export type MainTab = 'Home' | 'Library' | 'Collections' | 'Review' | 'Expressions';

interface BottomNavProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onQuickAdd: () => void;
  reviewDueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onQuickAdd,
  reviewDueCount = 7
}) => {
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF7]/95 backdrop-blur-md border-t border-stone-200/80 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-2">
        {/* Home */}
        <button
          type="button"
          onClick={() => onTabChange('Home')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'Home' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
          aria-label="Home screen"
        >
          <Home className={`w-5 h-5 ${currentTab === 'Home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-1">Home</span>
        </button>

        {/* Library */}
        <button
          type="button"
          onClick={() => onTabChange('Library')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'Library' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
          aria-label="Your vocabulary library"
        >
          <Bookmark className={`w-5 h-5 ${currentTab === 'Library' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-1">Library</span>
        </button>

        {/* Quick Add Center Button matching mockup */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onQuickAdd}
            className="w-12 h-12 rounded-full bg-[#FFE042] hover:bg-[#F7D836] shadow-md flex items-center justify-center text-stone-950 transition-transform active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-900"
            aria-label="Quick lookup or add discovery"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Collections */}
        <button
          type="button"
          onClick={() => onTabChange('Collections')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'Collections' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
          aria-label="Book collections"
        >
          <Layers className={`w-5 h-5 ${currentTab === 'Collections' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-1">Collections</span>
        </button>

        {/* Review */}
        <button
          type="button"
          onClick={() => onTabChange('Review')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'Review' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
          aria-label="Review flashcards"
        >
          <Sparkles className={`w-5 h-5 ${currentTab === 'Review' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-1">Review</span>
          {reviewDueCount > 0 && (
            <span className="absolute top-2 right-4 w-4 h-4 bg-[#FFE042] text-stone-950 text-[9px] font-bold rounded-full flex items-center justify-center shadow-2xs">
              {reviewDueCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
