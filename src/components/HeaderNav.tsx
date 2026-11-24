import React from 'react';
import { MainTab } from './BottomNav';
import { SayNestBird } from './SayNestBird';
import { Headphones, Plus, Sparkles, BookOpen, Layers, Bookmark, Home } from 'lucide-react';

interface HeaderNavProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenCommuteMode: () => void;
  onQuickAdd: () => void;
  reviewDueCount?: number;
  /** Sign-in / account button, when accounts are set up */
  accountSlot?: React.ReactNode;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onTabChange,
  onOpenCommuteMode,
  onQuickAdd,
  reviewDueCount = 7,
  accountSlot
}) => {
  const navItems: { tab: MainTab; label: string; icon: React.ElementType }[] = [
    { tab: 'Home', label: 'Home', icon: Home },
    { tab: 'Library', label: 'Library', icon: Bookmark },
    { tab: 'Collections', label: 'Collections', icon: Layers },
    { tab: 'Expressions', label: 'Expressions', icon: BookOpen },
    { tab: 'Review', label: 'Review', icon: Sparkles },
  ];

  return (
    <header className="hidden md:block w-full bg-[#FFFDF7]/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark with authentic bird */}
        <div 
          onClick={() => onTabChange('Home')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <SayNestBird variant="nest" size={32} />
          <span className="text-2xl font-black font-serif-display text-stone-950 tracking-tight">
            SayNest
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-semibold text-stone-600">
          {navItems.map(({ tab, label, icon: Icon }) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-stone-950 bg-[#FFE042]/40 font-bold'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2 text-stone-500'}`} />
                <span>{label}</span>
                {tab === 'Review' && reviewDueCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-[#FFE042] text-stone-950 text-[10px] font-bold rounded-full shadow-2xs">
                    {reviewDueCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFE042] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Add Discovery Button */}
          <button
            type="button"
            onClick={onQuickAdd}
            className="py-2 px-3.5 bg-stone-100 hover:bg-stone-200/80 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0"
            title="Quickly look up, scan, or add a word"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Word</span>
          </button>

          {/* Commute Mode CTA */}
          <button
            type="button"
            onClick={onOpenCommuteMode}
            className="py-2 px-3.5 bg-[#FFE042] hover:bg-[#F7D836] text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 whitespace-nowrap shrink-0"
            title="Listen to your vocabulary hands-free on the train or walk"
          >
            <Headphones className="w-4 h-4 stroke-[2.5]" />
            <span>Commute Audio</span>
          </button>
          {accountSlot}
        </div>
      </div>
    </header>
  );
};
