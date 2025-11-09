import { useState, useEffect, useRef } from 'react';
import { useAppKit } from '../../auth';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useVoteContract } from '../../../hooks/useVoteContract';

export const UserProfileComponent = () => {
  const { address, isConnected } = useAppKit();
  const { 
    userProfile, 
    isLoading 
  } = useUserProfile();
  
  const { 
    useTotalPollsCreated,
    useUserBalance,
    usePendingRewards,
    claimCreatorReward
  } = useVoteContract();

  const [showStats, setShowStats] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | null>(null);
  const hasShownModalRef = useRef(false);

  const { data: totalPollsCreated = 0n } = useTotalPollsCreated();
  const { data: balance = 0n } = useUserBalance();
  const { data: pendingRewards = 0n } = usePendingRewards();

  useEffect(() => {
    if (hasShownModalRef.current) {
      return;
    }

    if (isConnected && address && !userProfile && !isLoading) {
      hasShownModalRef.current = true;
    }
  }, [isConnected, address, userProfile, isLoading]);

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (value: bigint) => {
    return (Number(value) / 1e18).toFixed(2);
  };

  const safeProfile = userProfile || {
    nickname: 'Anonymous',
    avatar: '👤',
    walletAddress: address || 'Unknown',
    registeredAt: new Date().toISOString(),
    votesCast: 0,
    pollsCreated: 0,
    totalEarned: 0,
    reputation: 0
  };

  const progressToNextReward = Number(totalPollsCreated % 10n);
  const nextRewardProgress = (progressToNextReward / 10) * 100;

  const handleClaimReward = async () => {
    try {
      setShowClaimModal(true);
      const hash = await claimCreatorReward();
      
      if (hash) {
        setClaimTxHash(hash);
      } else {
        throw new Error('No transaction hash received');
      }
    } catch (error) {
      setShowClaimModal(false);
      setClaimTxHash(null);
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: 'Błąd podczas odbierania nagrody', type: 'error' } 
      }));
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/20 rounded w-1/3"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
          {safeProfile.avatar}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{safeProfile.nickname}</h3>
          <p className="text-white/80 text-sm">
            {formatAddress(safeProfile.walletAddress)}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Joined: {new Date(safeProfile.registeredAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{Number(totalPollsCreated)}</div>
            <div className="text-white/80 text-xs">Polls Created</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{safeProfile.votesCast}</div>
            <div className="text-white/80 text-xs">Votes Cast</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{formatBalance(balance)}</div>
            <div className="text-white/80 text-xs">VOTE Tokens</div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/80 text-sm font-medium">Reward Progress</span>
          <span className="text-white/60 text-xs">{progressToNextReward}/10 polls</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${nextRewardProgress}%` }}
          ></div>
        </div>
        
        <p className="text-white/60 text-xs text-center">
          {progressToNextReward === 0 ? 'Create polls to earn rewards!' : 
           `${10 - progressToNextReward} more for 10,000 VOTE`}
        </p>
      </div>

      {pendingRewards > 0n && (
        <button 
          onClick={handleClaimReward}
          disabled={showClaimModal}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showClaimModal ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Odbieranie...
            </div>
          ) : (
            <>
              🎁 Odbierz {formatBalance(pendingRewards)} VOTE
            </>
          )}
        </button>
      )}

      <div className="space-y-2">
        <button 
          onClick={() => setShowStats(!showStats)}
          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 text-sm"
        >
          {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
        </button>
      </div>
    </div>
  );
};