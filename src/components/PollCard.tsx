import { useState, useEffect } from 'react';
import { useVoteContract } from '../hooks/useVoteContract';
import { useAppKit } from '../modules/auth';
import { VoteModal } from '../modules/polls/components/VoteModal';

interface PollCardProps {
  pollId: bigint;
  isFeatured?: boolean;
  showAllOptions?: boolean;
  inCarousel?: boolean;
}

export const PollCard = ({ 
  pollId, 
  isFeatured = false, 
  showAllOptions = false,
  inCarousel = false 
}: PollCardProps) => {
  const { usePollInfo, usePollOptions, useHasVoted } = useVoteContract();
  const { address } = useAppKit();
  
  const { data: pollInfo, isLoading, error, refetch } = usePollInfo(pollId);
  const { data: hasVoted, refetch: refetchHasVoted } = useHasVoted(pollId);
  const { data: pollOptionsData } = usePollOptions(pollId);
  
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showAllOptionsState, setShowAllOptionsState] = useState(showAllOptions);
  const [options, setOptions] = useState<{ names: string[]; votes: bigint[] }>({ names: [], votes: [] });

  useEffect(() => {
    if (pollOptionsData) {
      const [optionNames, voteCounts] = pollOptionsData;
      setOptions({ names: optionNames, votes: voteCounts });
    }
  }, [pollOptionsData]);

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

  const toggleShowAllOptions = () => {
    setShowAllOptionsState(!showAllOptionsState);
  };

  const totalVotes = options.votes.reduce((sum, votes) => sum + votes, 0n);

  const getOptionPercentage = (optionIndex: number) => {
    if (!options.votes.length || totalVotes === 0n) return 0;
    const optionVotes = Number(options.votes[optionIndex]);
    const total = Number(totalVotes);
    return total > 0 ? (optionVotes / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className={`
        ${isFeatured 
          ? 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20' 
          : 'bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10'
        } 
        ${inCarousel ? 'h-full flex flex-col' : ''}
        animate-pulse
      `}>
        <div className={`bg-white/20 rounded ${isFeatured ? 'h-6 w-3/4 mb-4' : 'h-4 w-3/4 mb-3'}`}></div>
        <div className={`bg-white/20 rounded ${isFeatured ? 'h-4 w-1/2 mb-6' : 'h-3 w-1/2 mb-4'}`}></div>
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-8 bg-white/20 rounded"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
        <div className="h-10 bg-white/20 rounded flex-shrink-0"></div>
      </div>
    );
  }

  if (error || !pollInfo) {
    return (
      <div className={`
        ${isFeatured ? 'bg-red-500/20' : 'bg-red-500/10'} 
        backdrop-blur-sm rounded-xl p-4 border border-red-500/20
        ${inCarousel ? 'h-full flex items-center justify-center' : ''}
      `}>
        <p className={`text-red-300 ${isFeatured ? 'text-base' : 'text-sm'}`}>
          Error loading poll #{pollId.toString()}
        </p>
      </div>
    );
  }

  const [title, creator, ended, endTime, totalVotesFromContract] = pollInfo;

  const handleVoteClick = () => {
    if (ended) {
      alert('This poll has already ended!');
      return;
    }
    if (hasVoted) {
      alert('You have already voted in this poll!');
      return;
    }
    if (!address) {
      alert('Connect wallet to vote!');
      return;
    }
    setShowVoteModal(true);
  };

  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return { text: 'Ended', color: 'text-red-400' };
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    
    if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-green-400' };
    if (hours > 0) return { text: `${hours} hours`, color: 'text-yellow-400' };
    return { text: 'Ending soon!', color: 'text-red-400' };
  };

  const timeInfo = getTimeRemaining();

  const getVoteButtonText = () => {
    if (ended) return 'Ended';
    if (hasVoted) return 'Already Voted';
    if (!address) return 'Connect Wallet';
    return `Vote +100 VOTE`;
  };

  const getVoteButtonStyle = () => {
    if (ended) return 'bg-gray-500 cursor-not-allowed';
    if (hasVoted) return 'bg-green-500 cursor-not-allowed';
    if (!address) return 'bg-blue-500 cursor-pointer hover:bg-blue-600';
    return 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 cursor-pointer transform hover:scale-105';
  };

  const optionsToShow = showAllOptionsState ? options.names : options.names.slice(0, 5);
  const hasMoreOptions = options.names.length > 5 && !showAllOptionsState;

  return (
    <>
      <div className={`
        ${isFeatured 
          ? 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20 shadow-xl' 
          : 'bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10'
        } 
        ${inCarousel ? 'h-full flex flex-col' : ''}
        transition-all duration-300 group
      `}>
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div className="flex-1">
            <h3 className={`text-white font-bold leading-tight line-clamp-2 ${
              isFeatured ? 'text-xl mb-3' : 'text-sm mb-2'
            }`}>
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full font-semibold border ${
                isFeatured ? 'text-sm' : 'text-xs'
              } ${
                ended 
                  ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
              }`}>
                {ended ? 'Ended' : 'Active'}
              </span>
              {isFeatured && (
                <span className={`px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full font-semibold ${
                  isFeatured ? 'text-sm' : 'text-xs'
                }`}>
                  🔥 Featured
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-3 gap-3 text-center mb-4 flex-shrink-0`}>
          <div className="bg-white/5 rounded-lg p-3">
            <div className={`text-white font-bold ${isFeatured ? 'text-lg' : 'text-xs'}`}>{totalVotesFromContract.toString()}</div>
            <div className={`text-white/60 ${isFeatured ? 'text-sm' : 'text-xs'}`}>Votes</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className={`text-white font-bold ${isFeatured ? 'text-lg' : 'text-xs'}`}>{options.names.length}</div>
            <div className={`text-white/60 ${isFeatured ? 'text-sm' : 'text-xs'}`}>Options</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className={`font-bold ${timeInfo.color} ${isFeatured ? 'text-base' : 'text-xs'}`}>
              {timeInfo.text}
            </div>
            <div className={`text-white/60 ${isFeatured ? 'text-sm' : 'text-xs'}`}>Remaining</div>
          </div>
        </div>

        {options.names.length > 0 && (
          <div className={`flex-1 min-h-0 flex flex-col mb-4`}>
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <span className={`text-white/70 ${isFeatured ? 'text-base' : 'text-xs'}`}>
                Options ({options.names.length})
              </span>
              {options.names.length > 5 && (
                <button
                  onClick={toggleShowAllOptions}
                  className={`text-blue-400 hover:text-blue-300 transition-colors ${
                    isFeatured ? 'text-sm' : 'text-xs'
                  }`}
                >
                  {showAllOptionsState ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>
            <div className={`space-y-2 overflow-y-auto pr-2 flex-1 min-h-0`}>
              {optionsToShow.map((option, index) => {
                const percentage = getOptionPercentage(index);
                return (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10 flex-shrink-0">
                    <div className="flex-1 min-w-0">
                      <span className={`text-white/80 truncate block ${
                        isFeatured ? 'text-sm' : 'text-xs'
                      }`}>
                        {option}
                      </span>
                      <div className={`w-full bg-white/10 rounded-full ${isFeatured ? 'h-2 mt-2' : 'h-1 mt-1'}`}>
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            height: isFeatured ? '0.5rem' : '0.25rem'
                          }}
                        />
                      </div>
                    </div>
                    <span className={`text-white/60 ml-3 ${isFeatured ? 'text-sm' : 'text-xs'}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {hasMoreOptions && (
              <div className="text-center pt-3 flex-shrink-0">
                <span className={`text-white/50 ${isFeatured ? 'text-sm' : 'text-xs'}`}>
                  +{options.names.length - 5} more options...
                </span>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleVoteClick}
          disabled={ended || hasVoted || !address}
          className={`w-full text-white font-semibold rounded-lg transition-all flex-shrink-0 ${
            isFeatured ? 'py-4 text-lg' : 'py-2 text-sm'
          } ${getVoteButtonStyle()} ${
            !ended && !hasVoted && address ? 'group-hover:scale-105' : ''
          }`}
        >
          {getVoteButtonText()}
        </button>

        <div className={`flex justify-between items-center mt-3 pt-3 border-t border-white/10 flex-shrink-0`}>
          <span className={`text-white/50 ${isFeatured ? 'text-sm' : 'text-xs'}`}>
            ID: {pollId.toString()}
          </span>
          <span className={`text-white/50 truncate ml-2 ${isFeatured ? 'text-sm' : 'text-xs'}`} title={creator}>
            {creator.slice(0, 6)}...{creator.slice(-4)}
          </span>
        </div>
      </div>

      <VoteModal 
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        pollId={pollId}
        pollTitle={title}
      />
    </>
  );
};