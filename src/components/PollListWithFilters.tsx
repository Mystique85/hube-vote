import { useEffect, useState } from 'react';
import { useVoteContract } from '../hooks/useVoteContract';
import { usePollFilters } from '../hooks/usePollFilters';
import { VoteModal } from '../modules/polls/components/VoteModal';
import { useAppKit } from '../modules/auth';

const PollItem = ({ pollId, onVote }: { pollId: bigint; onVote: () => void }) => {
  const { usePollInfo, useHasVoted, usePollOptions } = useVoteContract();
  const { address } = useAppKit();
  const { data: pollInfo, isLoading, error, refetch } = usePollInfo(pollId);
  const { data: hasVoted, refetch: refetchHasVoted } = useHasVoted(pollId);
  const { data: pollOptionsData } = usePollOptions(pollId);
  const [showVoteModal, setShowVoteModal] = useState(false);

  const { getTimeRemainingText, getTimeRemainingColor, getPollStatus } = usePollFilters();

  useEffect(() => {
    const handleVoteCompleted = (event: CustomEvent) => {
      if (event.detail.pollId === pollId) {
        console.log('🔄 Refreshing poll after voting...');
        refetch();
        refetchHasVoted();
        onVote();
      }
    };

    window.addEventListener('voteCompleted', handleVoteCompleted as EventListener);
    return () => {
      window.removeEventListener('voteCompleted', handleVoteCompleted as EventListener);
    };
  }, [pollId, refetch, refetchHasVoted, onVote]);

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="h-8 bg-white/20 rounded"></div>
          <div className="h-8 bg-white/20 rounded"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
        <div className="h-10 bg-white/20 rounded"></div>
      </div>
    );
  }

  if (error || !pollInfo) {
    console.error(`❌ Error loading poll ${pollId}:`, error);
    return (
      <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
        <p className="text-red-300">Error loading poll #{pollId.toString()}</p>
      </div>
    );
  }

  const [title, creator, ended, endTime, totalVotes] = pollInfo;
  const options = pollOptionsData ? pollOptionsData[0] : [];

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
      alert('Please connect your wallet to vote!');
      return;
    }
    setShowVoteModal(true);
  };

  const getVoteButtonText = () => {
    if (ended) return '📅 Ended';
    if (hasVoted) return '✅ Voted';
    return '🗳️ Vote Now';
  };

  const getVoteButtonStyle = () => {
    if (ended) return 'bg-gray-500 cursor-not-allowed';
    if (hasVoted) return 'bg-green-500 cursor-not-allowed';
    return 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer';
  };

  const status = getPollStatus({ ended, endTime } as any);

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-white font-bold text-lg leading-tight flex-1 mr-4">{title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${status.color}`}>
            {status.text}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white font-bold text-lg">{totalVotes.toString()}</div>
            <div className="text-white/60 text-xs">Total Votes</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className={`font-bold text-sm ${getTimeRemainingColor(endTime)}`}>
              {getTimeRemainingText(endTime)}
            </div>
            <div className="text-white/60 text-xs">Time Left</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white font-bold text-xs truncate" title={creator}>
              {creator.slice(0, 6)}...{creator.slice(-4)}
            </div>
            <div className="text-white/60 text-xs">Creator</div>
          </div>
        </div>

        {options.length > 0 && (
          <div className="mb-4">
            <p className="text-white/70 text-sm mb-2">Options: {options.slice(0, 2).join(', ')}...</p>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-white/60 text-sm">
            Poll ID: {pollId.toString()}
          </div>
          {!ended && hasVoted && (
            <div className="text-green-400 text-sm font-medium flex items-center">
              ✅ You voted
            </div>
          )}
        </div>
        
        <button 
          onClick={handleVoteClick}
          disabled={ended || hasVoted || !address}
          className={`w-full py-3 text-white font-semibold rounded-xl transition-all ${getVoteButtonStyle()} ${
            !ended && !hasVoted && address ? 'hover:scale-105 transform' : ''
          }`}
        >
          {getVoteButtonText()}
        </button>
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

export const PollListWithFilters = () => {
  const { usePollCount } = useVoteContract();
  const { data: pollCount = 0n, isLoading: isLoadingCount, error: countError, refetch: refetchCount } = usePollCount();
  
  const {
    filters,
    updateFilter,
    clearFilters,
    getFilteredAndSortedPolls,
    activeFilterCount,
    hasActiveFilters,
    getFilterSummary
  } = usePollFilters();

  const [pollsData, setPollsData] = useState<any[]>([]);

  useEffect(() => {
    const handlePollCreated = () => {
      console.log('🔄 Refreshing polls after creation...');
      refetchCount();
    };

    window.addEventListener('pollCreated', handlePollCreated);
    return () => {
      window.removeEventListener('pollCreated', handlePollCreated);
    };
  }, [refetchCount]);

  // Generate poll data from pollCount
  useEffect(() => {
    if (pollCount > 0n) {
      const polls = [];
      const pollsToLoad = Math.min(Number(pollCount), 20);
      
      for (let i = 0; i < pollsToLoad; i++) {
        const pollId = BigInt(Number(pollCount) - 1 - i);
        polls.push({
          id: pollId,
          // Note: In a real app, you'd fetch actual poll data here
          // This is simplified for the example
          title: `Poll ${pollId}`,
          creator: '0x000...000',
          ended: false,
          endTime: BigInt(Math.floor(Date.now() / 1000) + 86400),
          totalVotes: BigInt(0),
          hasVoted: false
        });
      }
      
      setPollsData(polls);
    }
  }, [pollCount]);

  const handleVote = () => {
    // Refresh the poll list after voting
    refetchCount();
  };

  if (isLoadingCount) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/80">Loading polls...</p>
      </div>
    );
  }

  if (countError) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-red-300 mb-2">Error loading polls</h3>
        <p className="text-red-200">Check console for details</p>
      </div>
    );
  }

  if (pollCount === 0n) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗳️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No polls available</h3>
        <p className="text-white/60">Be the first to create a poll!</p>
        <button 
          className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
          onClick={() => window.dispatchEvent(new CustomEvent('showCreatePoll'))}
        >
          Create First Poll
        </button>
      </div>
    );
  }

  const filteredPolls = getFilteredAndSortedPolls(pollsData);
  const visiblePollCount = filteredPolls.length;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Active Polls {visiblePollCount > 0 && `(${visiblePollCount})`}
          </h2>
          <p className="text-white/60 text-sm">
            Total polls on chain: {Number(pollCount)}
            {hasActiveFilters && ` • ${getFilterSummary()}`}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('active', !filters.active)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                filters.active 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => updateFilter('ended', !filters.ended)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                filters.ended 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              Ended
            </button>
            <button
              onClick={() => updateFilter('myPolls', !filters.myPolls)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                filters.myPolls 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              My Polls
            </button>
            <button
              onClick={() => updateFilter('voted', !filters.voted)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                filters.voted 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              Voted
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as any)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="mostVotes">Most Votes</option>
            <option value="endingSoon">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Filter Status */}
      {hasActiveFilters && (
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-white/80 text-sm">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {visiblePollCount === 0 && pollCount > 0n && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No polls match your filters</h3>
          <p className="text-white/60">Try adjusting your filter settings</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Polls Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredPolls.map((poll) => (
          <PollItem 
            key={poll.id.toString()} 
            pollId={poll.id} 
            onVote={handleVote}
          />
        ))}
      </div>

      {/* Load More */}
      {filteredPolls.length < Number(pollCount) && (
        <div className="text-center pt-6">
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <p className="text-white/60 mb-3">
              Showing {filteredPolls.length} of {Number(pollCount)} polls
            </p>
            <button className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors border border-white/30">
              Load More Polls
            </button>
          </div>
        </div>
      )}
    </div>
  );
};