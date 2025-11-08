import { useState, useEffect } from 'react';
import { useVoteContract } from '../hooks/useVoteContract';
import { PollCard } from './PollCard';
import { CarouselNavigation } from './CarouselNavigation';

interface PollCarouselProps {
  title: string;
  pollIds: bigint[];
  autoPlay?: boolean;
  showStatus?: boolean;
}

export const PollCarousel = ({ 
  title, 
  pollIds, 
  autoPlay = false,
  showStatus = true 
}: PollCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const { usePollCount } = useVoteContract();

  const { data: pollCount = 0n } = usePollCount();
  const visiblePolls = pollIds.slice(0, 20); // Max 20 ankiet w karuzeli

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || visiblePolls.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visiblePolls.length);
    }, 8000); // Zmiana co 8 sekund

    return () => clearInterval(interval);
  }, [isAutoPlaying, visiblePolls.length]);

  // Reset when pollIds change
  useEffect(() => {
    setCurrentIndex(0);
  }, [pollIds]);

  if (visiblePolls.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="text-white/60">Brak ankiet do wyświetlenia</div>
      </div>
    );
  }

  const getVisiblePollIds = () => {
    // Na mobile: 1 karta, na desktop: 3 karty
    const isMobile = window.innerWidth < 768;
    const cardsToShow = isMobile ? 1 : 3;
    
    const startIndex = currentIndex;
    const endIndex = Math.min(currentIndex + cardsToShow, visiblePolls.length);
    
    let pollIdsSlice = visiblePolls.slice(startIndex, endIndex);
    
    // Jeśli brakuje kart do pokazania, weź z początku tablicy
    if (pollIdsSlice.length < cardsToShow && visiblePolls.length > cardsToShow) {
      const needed = cardsToShow - pollIdsSlice.length;
      pollIdsSlice = [...pollIdsSlice, ...visiblePolls.slice(0, needed)];
    }
    
    return pollIdsSlice;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % visiblePolls.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + visiblePolls.length) % visiblePolls.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const visiblePollIds = getVisiblePollIds();

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          {showStatus && (
            <p className="text-white/60 text-sm">
              {visiblePolls.length} ankiet • {currentIndex + 1}/{visiblePolls.length}
            </p>
          )}
        </div>
        
        {autoPlay && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isAutoPlaying 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
            }`}
          >
            {isAutoPlaying ? '⏸️ Auto' : '▶️ Auto'}
          </button>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        {visiblePolls.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
              aria-label="Poprzednia ankieta"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
              aria-label="Następna ankieta"
            >
              ›
            </button>
          </>
        )}

        {/* Poll Cards Grid */}
        <div className={`
          grid gap-4 transition-all duration-300
          ${visiblePollIds.length === 1 ? 'grid-cols-1' : ''}
          ${visiblePollIds.length === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
          ${visiblePollIds.length >= 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
        `}>
          {visiblePollIds.map((pollId, index) => (
            <PollCard 
              key={`${pollId}-${currentIndex}-${index}`}
              pollId={pollId}
              isFeatured={index === 0 && currentIndex === 0}
            />
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      {visiblePolls.length > 1 && (
        <CarouselNavigation
          totalSlides={visiblePolls.length}
          currentSlide={currentIndex}
          onDotClick={goToSlide}
        />
      )}

      {/* Progress Bar */}
      {isAutoPlaying && (
        <div className="mt-4 w-full bg-white/10 rounded-full h-1">
          <div 
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full transition-all duration-1000"
            style={{ 
              width: `${((currentIndex + 1) / visiblePolls.length) * 100}%` 
            }}
          />
        </div>
      )}
    </div>
  );
};