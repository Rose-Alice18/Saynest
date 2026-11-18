import React from 'react';

interface BookCoverProps {
  collectionId?: string;
  title?: string;
  author?: string;
  coverImage?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  collectionId = 'pride-and-prejudice',
  title = 'Pride and Prejudice',
  author = 'Jane Austen',
  coverImage,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-8.5 text-[6px]',
    sm: 'w-11 h-16 text-[7px]',
    md: 'w-15 h-21 text-[8px]',
    lg: 'w-20 h-28 text-[10px]',
    xl: 'w-24 h-34 text-xs'
  }[size];

  // 1. Direct coverImage provided (e.g. online fetched cover from OpenLibrary / Google Books)
  if (coverImage) {
    return (
      <div
        className={`relative ${sizeClasses} rounded-md shadow-md overflow-hidden shrink-0 transition-transform group-hover:scale-[1.02] border border-stone-400/40 bg-stone-100 ${className}`}
      >
        <img
          src={coverImage}
          alt={`${title} book cover`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback if remote URL fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* Subtle realistic book spine highlight & shadow */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 via-white/20 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-0.5 bg-black/15 pointer-events-none" />
      </div>
    );
  }

  // 2. Pride and Prejudice: uses the exact illustrated cover from reference mockup
  if (
    collectionId === 'pride-and-prejudice' ||
    (title && title.toLowerCase().includes('pride'))
  ) {
    return (
      <div
        className={`relative ${sizeClasses} rounded-md shadow-md overflow-hidden shrink-0 transition-transform group-hover:scale-[1.02] border border-stone-400/40 ${className}`}
      >
        <img
          src="/assets/aistudio/pride_prejudice_cover.png"
          alt="Pride and Prejudice illustrated book cover"
          className="w-full h-full object-cover"
        />
        {/* Subtle realistic book spine highlight & shadow */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 via-white/20 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-0.5 bg-black/15 pointer-events-none" />
      </div>
    );
  }

  // 2. Academic Writing & Rhetoric: Deep emerald cloth bound book with gold flourish
  if (
    collectionId === 'academic-writing' ||
    (title && title.toLowerCase().includes('academic'))
  ) {
    return (
      <div
        className={`relative ${sizeClasses} rounded-md shadow-md overflow-hidden shrink-0 bg-[#1E3A2F] text-[#F3E5AB] flex flex-col justify-between p-1.5 border border-emerald-950 font-serif ${className}`}
      >
        <div className="border border-[#F3E5AB]/40 p-1 rounded-xs flex-1 flex flex-col justify-between">
          <div className="text-center font-bold tracking-wider leading-tight uppercase line-clamp-3">
            {title}
          </div>
          <div className="text-center text-[7px] italic opacity-85">
            {author || 'Rhetoric'}
          </div>
        </div>
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
      </div>
    );
  }

  // 3. Default / Daily Nuance / Other: Warm parchment and terracotta illustrated jacket
  return (
    <div
      className={`relative ${sizeClasses} rounded-md shadow-md overflow-hidden shrink-0 bg-[#F5E6CA] text-stone-900 flex flex-col justify-between p-1.5 border border-stone-300 font-serif ${className}`}
    >
      <div className="border border-stone-700/30 p-1 rounded-xs flex-1 flex flex-col justify-between bg-[#FFFDF7]/60">
        <div className="font-bold tracking-tight leading-tight line-clamp-3">
          {title}
        </div>
        <div className="text-[7px] italic text-stone-600">
          {author || 'Discoveries'}
        </div>
      </div>
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/30 via-white/20 to-transparent pointer-events-none" />
    </div>
  );
};
