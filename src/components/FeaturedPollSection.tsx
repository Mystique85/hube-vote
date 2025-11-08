import { useState, useEffect } from 'react';
import { useVoteContract } from '../hooks/useVoteContract';
import { useAppKit } from '../modules/auth';
import { VoteModal } from '../modules/polls/components/VoteModal';
import { Tooltip } from './Tooltip';

export const FeaturedPollSection = () => {
  const { usePollInfo, usePollOptions, useHasVoted, usePollCount } = useVoteContract();
  const { address } = useAppKit();
  const [featuredPollId, setFeaturedPollId] = useState<bigint | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get the latest poll as featured poll
  const { data: pollCount = 0n } = usePollCount();
  
  const { data: pollInfo } = usePollInfo(featuredPollId!);
  const { data: pollOptionsData } = usePollOptions(featuredPollId!);
  const { data: hasVoted } = useHasVoted(featuredPollId!);

  useEffect(() => {
    if (pollCount > 0n) {
      // Set the latest poll as featured
      const latestPollId = BigInt(Number(pollCount) - 1);
      setFeaturedPollId(latestPollId);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [pollCount]);

  // Refresh when new polls are created
  useEffect(() => {
    const handlePollCreated = () => {
      if (pollCount > 0n) {
        const latestPollId = BigInt(Number(pollCount) - 1);
        setFeaturedPollId(latestPollId);
      }
    };

    window.addEventListener('pollCreated', handlePollCreated);
    return () => window.removeEventListener('pollCreated', handlePollCreated);
  }, [pollCount]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse h-48">
        <div className="h-4 bg-white/20 rounded w-1/2 mb-4"></div>
        <div className="h-3 bg-white/20 rounded w-3/4 mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="h-8 bg-white/20 rounded"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  // WHEN NO POLLS - COMPACT EMPTY STATE
  if (!featuredPollId || !pollInfo) {
    return (
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center h-48 flex flex-col justify-center">
        <div className="text-4xl mb-3">🌟</div>
        <h3 className="text-lg font-bold text-white mb-2">Brak Wyróżnionej Ankiety</h3>
        <p className="text-white/70 text-sm">Bądź pierwszy i utwórz ankietę!</p>
      </div>
    );
  }

  const [title, creator, ended, endTime, totalVotes] = pollInfo;
  const options = pollOptionsData ? pollOptionsData[0] : [];
  const votes = pollOptionsData ? pollOptionsData[1] : [];

  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return { text: 'Zakończona', color: 'text-red-400' };
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (hours > 0) return { text: `${hours}g ${minutes}m`, color: 'text-green-400' };
    return { text: `${minutes} minut`, color: 'text-red-400' };
  };

  const timeInfo = getTimeRemaining();

  const handleVoteClick = () => {
    if (ended) {
      alert('Ta ankieta już się zakończyła!');
      return;
    }
    if (hasVoted) {
      alert('Już oddałeś głos w tej ankiecie!');
      return;
    }
    if (!address) {
      alert('Połącz portfel aby głosować!');
      return;
    }
    setShowVoteModal(true);
  };

  const getVoteButtonText = () => {
    if (ended) return 'Zakończona';
    if (hasVoted) return 'Już Głosowano';
    if (!address) return 'Połącz Portfel';
    return `Głosuj +100 VOTE`;
  };

  const getVoteButtonStyle = () => {
    if (ended) return 'bg-gray-500 cursor-not-allowed';
    if (hasVoted) return 'bg-green-500 cursor-not-allowed';
    if (!address) return 'bg-blue-500 cursor-pointer hover:bg-blue-600';
    return 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 cursor-pointer';
  };

  // Calculate option percentages for top 2 options
  const getOptionPercentage = (optionIndex: number) => {
    if (!votes || totalVotes === 0n) return 0;
    const optionVotes = Number(votes[optionIndex]);
    const total = Number(totalVotes);
    return total > 0 ? (optionVotes / total) * 100 : 0;
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold">
                🔥 Wyróżniona
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                ended 
                  ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
              }`}>
                {ended ? 'Zakończona' : 'Aktywna'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1 leading-tight line-clamp-2">
              {title}
            </h2>
            <div className="flex items-center gap-3 text-white/70 text-xs">
              <span>👥 {totalVotes.toString()} głosów</span>
              <span className={timeInfo.color}>⏰ {timeInfo.text}</span>
            </div>
          </div>
        </div>

        {/* Compact Options Preview */}
        {options.length > 0 && (
          <div className="mb-4 flex-1">
            <div className="space-y-2">
              {options.slice(0, 2).map((option, index) => {
                const percentage = getOptionPercentage(index);
                return (
                  <div key={index} className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-xs truncate flex-1 mr-2">{option}</span>
                      <span className="text-white/70 text-xs">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact Action Section */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <div className="text-white/70 text-xs">
            {hasVoted && !ended && (
              <span className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded border border-green-500/30 text-green-300">
                ✅ Oddałeś głos
              </span>
            )}
          </div>

          <button
            onClick={handleVoteClick}
            disabled={ended || hasVoted || !address}
            className={`px-4 py-2 text-white font-semibold rounded-lg transition-all text-sm ${getVoteButtonStyle()}`}
          >
            {getVoteButtonText()}
          </button>
        </div>
      </div>

      {/* Vote Modal */}
      <VoteModal 
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        pollId={featuredPollId}
        pollTitle={title}
      />
    </>
  );
};