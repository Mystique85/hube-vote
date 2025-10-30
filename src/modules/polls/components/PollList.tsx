import { useEffect, useState } from 'react';
import { useVoteContract } from '../../../hooks/useVoteContract';
import { debugLogger } from '../../../utils/debugLogger';
import { VoteModal } from './VoteModal';

interface Poll {
  id: bigint;
  title: string;
  creator: string;
  ended: boolean;
  endTime: bigint;
  totalVotes: bigint;
}

const PollItem = ({ pollId }: { pollId: bigint }) => {
  const { usePollInfo, useHasVoted } = useVoteContract();
  const { data: pollInfo, isLoading, error, refetch } = usePollInfo(pollId);
  const { data: hasVoted, refetch: refetchHasVoted } = useHasVoted(pollId);
  const [showVoteModal, setShowVoteModal] = useState(false);

  useEffect(() => {
    const handleVoteCompleted = (event: CustomEvent) => {
      if (event.detail.pollId === pollId) {
        console.log('🔄 Automatic refresh after voting...');
        refetch();
        refetchHasVoted();
      }
    };

    window.addEventListener('voteCompleted', handleVoteCompleted as EventListener);
    
    return () => {
      window.removeEventListener('voteCompleted', handleVoteCompleted as EventListener);
    };
  }, [pollId, refetch, refetchHasVoted]);

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
    debugLogger.contractError(`getPollInfo-${pollId}`, error);
    return (
      <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
        <p className="text-red-300">Error loading poll #{pollId.toString()}</p>
      </div>
    );
  }

  const [title, creator, ended, endTime, totalVotes] = pollInfo;

  const handleVoteClick = () => {
    if (ended) {
      alert('This poll has already ended!');
      return;
    }
    if (hasVoted) {
      alert('You have already voted in this poll!');
      return;
    }
    setShowVoteModal(true);
  };

  const getVoteButtonText = () => {
    if (ended) return '📅 Ended';
    if (hasVoted) return '✅ Already Voted';
    return '🗳️ Vote (+100 VOTE)';
  };

  const getVoteButtonStyle = () => {
    if (ended) return 'bg-gray-500 cursor-not-allowed';
    if (hasVoted) return 'bg-green-500 cursor-not-allowed';
    return 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer';
  };

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            ended 
              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
              : 'bg-green-500/20 text-green-300 border border-green-500/30'
          }`}>
            {ended ? 'Ended' : 'Active'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white font-bold">{totalVotes.toString()}</div>
            <div className="text-white/60 text-xs">Votes</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white font-bold text-sm">
              {new Date(Number(endTime) * 1000).toLocaleDateString()}
            </div>
            <div className="text-white/60 text-xs">Ends</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white font-bold text-xs truncate">
              {creator.slice(0, 6)}...{creator.slice(-4)}
            </div>
            <div className="text-white/60 text-xs">Creator</div>
          </div>
        </div>
        
        <div className="text-center text-white/60 text-sm mb-4">
          Poll ID: {pollId.toString()}
        </div>
        
        <button 
          onClick={handleVoteClick}
          disabled={ended || hasVoted}
          className={`w-full py-3 text-white font-semibold rounded-xl transition-all ${getVoteButtonStyle()}`}
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

export const PollList = () => {
  const { usePollCount } = useVoteContract();
  const { data: pollCount = 0n, isLoading: isLoadingCount, error: countError, refetch: refetchCount } = usePollCount();

  useEffect(() => {
    const handlePollCreated = () => {
      console.log('🔄 Automatic refresh after poll creation...');
      refetchCount();
    };

    window.addEventListener('pollCreated', handlePollCreated);
    
    return () => {
      window.removeEventListener('pollCreated', handlePollCreated);
    };
  }, [refetchCount]);

  useEffect(() => {
    if (countError) {
      debugLogger.contractError('pollCount', countError);
    }
    
    if (pollCount > 0n) {
      debugLogger.pollDebug.loadingPolls(pollCount, Math.min(Number(pollCount), 10));
    }
  }, [pollCount, countError]);

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
        <p className="text-red-200">Check F12 console for details</p>
      </div>
    );
  }

  if (pollCount === 0n) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗳️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No polls available</h3>
        <p className="text-white/60">Be the first to create a poll!</p>
      </div>
    );
  }

  const pollItems = [];
  const pollsToShow = Math.min(Number(pollCount), 10);
  
  for (let i = 0; i < pollsToShow; i++) {
    const pollId = BigInt(Number(pollCount) - 1 - i);
    pollItems.push(<PollItem key={pollId.toString()} pollId={pollId} />);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        Active Polls ({pollItems.filter((_, index) => {
          return true;
        }).length})
      </h2>
      
      <div className="grid gap-6">
        {pollItems}
      </div>

      {pollItems.length < Number(pollCount) && (
        <div className="text-center">
          <p className="text-white/60">
            And more polls... ({Number(pollCount) - pollItems.length} hidden)
          </p>
        </div>
      )}
    </div>
  );
};