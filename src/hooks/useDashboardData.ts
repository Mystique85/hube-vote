import { useEffect } from 'react';
import { useGlobalStats } from './useGlobalStats';
import { useLeaderboard } from './useLeaderboard';
import { useVoteContract } from './useVoteContract';
import { useUserProfile } from './useUserProfile';

export const useDashboardData = () => {
  const { stats, isLoading: statsLoading, incrementVoteCount } = useGlobalStats();
  const { 
    leaderboard, 
    isLoading: leaderboardLoading, 
    currentUserRank,
    currentUserData 
  } = useLeaderboard();
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const { useUserBalance, useTotalPollsCreated } = useVoteContract();

  const { data: userBalance = 0n } = useUserBalance();
  const { data: userPollsCreated = 0n } = useTotalPollsCreated();

  useEffect(() => {
    const handleUserVoted = () => {
      incrementVoteCount();
    };

    window.addEventListener('userVoted', handleUserVoted as EventListener);
    return () => window.removeEventListener('userVoted', handleUserVoted as EventListener);
  }, [incrementVoteCount]);

  const isLoading = statsLoading || leaderboardLoading || profileLoading;

  const userStats = {
    pollsCreated: Number(userPollsCreated),
    votesCast: userProfile?.votesCast || 0,
    tokenBalance: Number(userBalance) / 1e18,
    reputation: userProfile?.reputation || 0,
    rank: currentUserRank
  };

  return {
    globalStats: stats,
    leaderboard,
    userStats,
    isLoading,
    currentUserRank,
    currentUserData
  };
};