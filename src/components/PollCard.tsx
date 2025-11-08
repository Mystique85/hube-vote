import { useState, useEffect } from 'react';
import { useVoteContract } from '../hooks/useVoteContract';
import { useAppKit } from '../modules/auth';
import { VoteModal } from '../modules/polls/components/VoteModal';

interface PollCardProps {
  pollId: bigint;
  isFeatured?: boolean;
}

export const PollCard = ({ pollId, isFeatured = false }: PollCardProps) => {
  const { usePollInfo, usePollOptions, useHasVoted } = useVoteContract();
  const { address } = useAppKit();
  
  const { data: pollInfo, isLoading, error, refetch } = usePollInfo(pollId);
  const { data: hasVoted, refetch: refetchHasVoted } = useHasVoted(pollId);
  const { data: pollOptionsData } = usePollOptions(pollId);
  
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [options, setOptions] = useState<{ names: string[]; votes: bigint[] }>({ names: [], votes: [] });

  useEffect(() => {
    if (pollOptionsData) {
      const [optionNames, voteCounts] = pollOptionsData;
      setOptions({ names: optionNames, votes: voteCounts });
    }
  }, [pollOptionsData]);

  // Refresh after voting
  useEffect(() => {
    const handleVoteCompleted = (event: CustomEvent) => {
      if (event.detail.pollId === pollId) {
        refetch();
        refetchHasVoted();
      }
    };

    window.addEventListener('voteCompleted', handleVoteCompleted as EventListener);
    return () => window.removeEventListener('voteCompleted', handleVoteCompleted as EventListener);
  }, [pollId, refetch, refetchHasVoted]);

  if (isLoading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 animate-pulse ${
        isFeatured ? 'ring-2 ring-yellow-400/50' : ''
      }`}>
        <div className="h-4 bg-white/20 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-white/20 rounded w-1/2 mb-4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-8 bg-white/20 rounded"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
        <div className="h-10 bg-white/20 rounded"></div>
      </div>
    );
  }

  if (error || !pollInfo) {
    return (
      <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
        <p className="text-red-300 text-sm">Błąd ładowania ankiety #{pollId.toString()}</p>
      </div>
    );
  }

  const [title, creator, ended, endTime, totalVotes] = pollInfo;

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

  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return { text: 'Zakończona', color: 'text-red-400' };
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    
    if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-green-400' };
    if (hours > 0) return { text: `${hours} godzin`, color: 'text-yellow-400' };
    return { text: 'Kończy się!', color: 'text-red-400' };
  };

  const timeInfo = getTimeRemaining();

  const getVoteButtonText = () => {
    if (ended) return 'Zakończona';
    if (hasVoted) return 'Już głosowano';
    if (!address) return 'Połącz portfel';
    return `Głosuj +100 VOTE`;
  };

  const getVoteButtonStyle = () => {
    if (ended) return 'bg-gray-500 cursor-not-allowed';
    if (hasVoted) return 'bg-green-500 cursor-not-allowed';
    if (!address) return 'bg-blue-500 cursor-pointer hover:bg-blue-600';
    return 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 cursor-pointer transform hover:scale-105';
  };

  // Calculate percentage for the first option (for preview)
  const getFirstOptionPercentage = () => {
    if (!options.votes.length || totalVotes === 0n) return 0;
    const firstOptionVotes = Number(options.votes[0]);
    const total = Number(totalVotes);
    return total > 0 ? (firstOptionVotes / total) * 100 : 0;
  };

  return (
    <>
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group ${
        isFeatured ? 'ring-2 ring-yellow-400/50 shadow-lg' : ''
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                ended 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {ended ? 'Zakończona' : 'Aktywna'}
              </span>
              {isFeatured && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold">
                  🔥 Wyróżniona
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white font-bold text-xs">{totalVotes.toString()}</div>
            <div className="text-white/60 text-xs">Głosów</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white font-bold text-xs">{options.names.length}</div>
            <div className="text-white/60 text-xs">Opcji</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className={`font-bold text-xs ${timeInfo.color}`}>
              {timeInfo.text}
            </div>
            <div className="text-white/60 text-xs">Pozostało</div>
          </div>
        </div>

        {/* Options Preview */}
        {options.names.length > 0 && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/70 text-xs">Opcje:</span>
              <span className="text-white/60 text-xs">{getFirstOptionPercentage().toFixed(0)}%</span>
            </div>
            <div className="space-y-1">
              {options.names.slice(0, 2).map((option, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white/80 text-xs truncate flex-1 mr-2">
                    {option}
                  </span>
                  <span className="text-white/60 text-xs">
                    {options.votes[index]?.toString() || 0}
                  </span>
                </div>
              ))}
              {options.names.length > 2 && (
                <div className="text-center">
                  <span className="text-white/50 text-xs">
                    +{options.names.length - 2} więcej...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar Preview */}
        {options.names.length > 0 && totalVotes > 0n && (
          <div className="w-full bg-white/10 rounded-full h-1 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${getFirstOptionPercentage()}%` }}
            />
          </div>
        )}

        {/* Vote Button */}
        <button 
          onClick={handleVoteClick}
          disabled={ended || hasVoted || !address}
          className={`w-full py-2 text-white font-semibold rounded-lg transition-all text-sm ${getVoteButtonStyle()} ${
            !ended && !hasVoted && address ? 'group-hover:scale-105' : ''
          }`}
        >
          {getVoteButtonText()}
        </button>

        {/* Creator Info */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
          <span className="text-white/50 text-xs">
            ID: {pollId.toString()}
          </span>
          <span className="text-white/50 text-xs truncate ml-2" title={creator}>
            {creator.slice(0, 6)}...{creator.slice(-4)}
          </span>
        </div>
      </div>

      {/* Vote Modal */}
      <VoteModal 
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        pollId={pollId}
        pollTitle={title}
      />
    </>
  );
};