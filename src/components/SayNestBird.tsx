import React from 'react';

export type BirdVariant = 
  | 'reading' 
  | 'headphones' 
  | 'flag' 
  | 'nest' 
  | 'simple' 
  | 'tiptoe' 
  | 'study' 
  | 'flashcard'
  | 'heart';

interface SayNestBirdProps {
  variant?: BirdVariant;
  className?: string;
  size?: number | string;
}

export const SayNestBird: React.FC<SayNestBirdProps> = ({
  variant = 'reading',
  className = '',
  size = 64
}) => {
  // Map variant to the authentic hand-drawn expressive mascot assets
  let imageSrc = '/assets/aistudio/home_hero_bird.png';
  let altText = 'SayNest reading chick mascot';

  if (variant === 'headphones') {
    imageSrc = '/assets/aistudio/commute_bird.png';
    altText = 'SayNest chick wearing headphones on commute';
  } else if (variant === 'flag') {
    imageSrc = '/assets/aistudio/expressions_flag_bird.png';
    altText = 'SayNest chick holding flag';
  } else if (variant === 'tiptoe') {
    imageSrc = '/assets/aistudio/continue_bird.png';
    altText = 'SayNest chick stepping happily';
  } else if (variant === 'study') {
    imageSrc = '/assets/aistudio/review_header_bird.png';
    altText = 'SayNest chick studying on cushion';
  } else if (variant === 'flashcard') {
    imageSrc = '/assets/aistudio/review_flashcard_bird.png';
    altText = 'SayNest chick sitting happily';
  } else if (variant === 'heart') {
    imageSrc = '/assets/aistudio/word_result_bird.png';
    altText = 'SayNest chick reading by candlelight';
  }

  // Handle nest / logo variant: cute icon with nest
  if (variant === 'nest' || variant === 'simple') {
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/assets/aistudio/word_result_bird.png"
            alt="SayNest mascot"
            className="w-full h-full object-contain drop-shadow-xs"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: size, height: typeof size === 'number' ? size : undefined }}
    >
      <img
        src={imageSrc}
        alt={altText}
        className="w-full h-full object-contain filter contrast-105"
        loading="eager"
      />
    </div>
  );
};
