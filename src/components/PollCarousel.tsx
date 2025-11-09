import { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlaying || pollIds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pollIds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, pollIds.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [pollIds]);

  const nextSlide = () => {
    const newIndex = (currentIndex + 1) % pollIds.length;
    setCurrentIndex(newIndex);
  };

  const prevSlide = () => {
    const newIndex = (currentIndex - 1 + pollIds.length) % pollIds.length;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (pollIds.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="text-white/60">No polls to display</div>
      </div>
    );
  }

  const currentPollId = pollIds[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          {showStatus && (
            <p className="text-white/60 text-sm">
              {currentIndex + 1} of {pollIds.length} polls
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

      <div className="relative flex-1 flex flex-col min-h-0">
        
        {pollIds.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 bg-blue-600/90 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all border-2 border-white/40 shadow-2xl backdrop-blur-sm"
              aria-label="Previous poll"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 bg-blue-600/90 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all border-2 border-white/40 shadow-2xl backdrop-blur-sm"
              aria-label="Next poll"
            >
              ›
            </button>
          </>
        )}

        <div className="flex-1 flex items-stretch px-10 min-h-0">
          <div className="w-full h-full transform transition-all duration-300 flex">
            <div className="flex-1 w-full h-full">
              <PollCard 
                key={`carousel-${currentPollId}-${currentIndex}`}
                pollId={currentPollId}
                isFeatured={true}
                showAllOptions={true}
                inCarousel={true}
              />
            </div>
          </div>
        </div>

        {pollIds.length > 1 && (
          <div className="mt-4 pt-4 border-t border-white/20 flex-shrink-0">
            <CarouselNavigation
              totalSlides={pollIds.length}
              currentSlide={currentIndex}
              onDotClick={goToSlide}
            />
          </div>
        )}
      </div>

      {isAutoPlaying && (
        <div className="mt-3 w-full bg-white/10 rounded-full h-1 flex-shrink-0">
          <div 
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full transition-all duration-1000"
            style={{ 
              width: `${((currentIndex + 1) / pollIds.length) * 100}%` 
            }}
          />
        </div>
      )}
    </div>
  );
};