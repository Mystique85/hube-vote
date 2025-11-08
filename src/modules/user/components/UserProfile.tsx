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
    useTotalPollsCreated
  } = useVoteContract();

  const [showStats, setShowStats] = useState(true);
  const hasShownModalRef = useRef(false); // 🔥 FIX: Zapobiega wielokrotnemu wywołaniu

  const { data: totalPollsCreated = 0n } = useTotalPollsCreated();

  // Auto-create anonymous profile for new users - NAPRAWIONE
  useEffect(() => {
    // Sprawdzamy czy już pokazaliśmy modal dla tego użytkownika
    if (hasShownModalRef.current) {
      return;
    }

    if (isConnected && address && !userProfile && !isLoading) {
      console.log('✅ Auto-creating anonymous profile for new user');
      hasShownModalRef.current = true; // 🔥 ZAPISUJEMY że już pokazaliśmy
    }
  }, [isConnected, address, userProfile, isLoading]); // 🔥 POPRAWNE ZALEŻNOŚCI

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Safe profile data - zawsze ma wartość domyślną
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

  // NIE RENDERUJ jeśli wallet niepołączony
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

  const progressToNextReward = Number(totalPollsCreated % 10n);
  const nextRewardProgress = (progressToNextReward / 10) * 100;

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
      {/* Profile Header */}
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

      {/* Quick Stats */}
      {showStats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{Number(totalPollsCreated)}</div>
            <div className="text-white/80 text-xs">Polls Created</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{safeProfile.votesCast}</div>
            <div className="text-white/80 text-xs">Votes Cast</div>
          </div>
        </div>
      )}

      {/* Reward Progress */}
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

      {/* Quick Actions */}
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