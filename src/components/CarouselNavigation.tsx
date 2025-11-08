import React from 'react';

interface CarouselNavigationProps {
  totalSlides: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
  className?: string;
}

export const CarouselNavigation: React.FC<CarouselNavigationProps> = ({
  totalSlides,
  currentSlide,
  onDotClick,
  className = ''
}) => {
  if (totalSlides <= 1) return null;

  return (
    <div className={`flex justify-center items-center space-x-2 mt-4 ${className}`}>
      {/* Previous Arrow */}
      <button
        onClick={() => onDotClick((currentSlide - 1 + totalSlides) % totalSlides)}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        aria-label="Poprzednia strona"
      >
        ‹
      </button>

      {/* Dots */}
      <div className="flex space-x-1">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Przejdź do strony ${index + 1}`}
          />
        ))}
      </div>

      {/* Next Arrow */}
      <button
        onClick={() => onDotClick((currentSlide + 1) % totalSlides)}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        aria-label="Następna strona"
      >
        ›
      </button>
    </div>
  );
};

// Compact version for mobile
export const CompactCarouselNavigation: React.FC<CarouselNavigationProps> = ({
  totalSlides,
  currentSlide,
  onDotClick,
  className = ''
}) => {
  if (totalSlides <= 1) return null;

  return (
    <div className={`flex justify-center items-center space-x-3 mt-4 ${className}`}>
      {/* Progress Text */}
      <span className="text-white/70 text-sm min-w-[60px] text-center">
        {currentSlide + 1} / {totalSlides}
      </span>

      {/* Dots */}
      <div className="flex space-x-1">
        {Array.from({ length: Math.min(totalSlides, 10) }).map((_, index) => (
          <button
            key={index}
            onClick={() => onDotClick(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
        {totalSlides > 10 && (
          <span className="text-white/50 text-xs ml-1">+{totalSlides - 10}</span>
        )}
      </div>
    </div>
  );
};

export default CarouselNavigation;