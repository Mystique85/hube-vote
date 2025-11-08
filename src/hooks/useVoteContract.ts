import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { useAppKit } from '../modules/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useVoteContract = () => {
  const { address } = useAppKit();
  const queryClient = useQueryClient();
  
  // Odczyt danych z kontraktu
  const usePollCount = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pollCount',
    query: {
      refetchInterval: 15000, // Auto-refresh co 15 sekund
    }
  });

  const usePollInfo = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPollInfo',
    args: [pollId],
    query: { 
      enabled: pollId !== undefined,
      refetchInterval: 10000, // Auto-refresh co 10 sekund
    }
  });

  const usePollOptions = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPollOptionsWithVotes',
    args: [pollId],
    query: { 
      enabled: pollId !== undefined,
      refetchInterval: 10000,
    }
  });

  const useHasVoted = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasUserVoted',
    args: [pollId, address ?? '0x0000000000000000000000000000000000000000'],
    query: { 
      enabled: !!address && pollId !== undefined,
      refetchInterval: 10000,
    }
  });

  const useUserBalance = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { 
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  const usePendingRewards = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pendingCreatorRewards',
    args: [address!],
    query: { 
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  const useTotalPollsCreated = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'totalPollsCreated',
    args: [address!],
    query: { 
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  const useDailyPollsCreated = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'dailyPollsCreated',
    args: [address!],
    query: { 
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  // Zapisy do kontraktu
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const executeContractWrite = async (functionName: string, args: any[]) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName,
        args,
      });
      
      // Invalidate queries after successful write
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
        queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
        queryClient.invalidateQueries({ queryKey: ['pollCount'] });
        queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
        queryClient.invalidateQueries({ queryKey: ['dailyPollsCreated', address] });
      }, 2000); // Wait 2 seconds before refreshing
      
      return hash;
    } catch (error) {
      console.error(`❌ ${functionName} error:`, error);
      throw error;
    }
  };

  const useTransactionStatus = (hash: `0x${string}` | undefined) => {
    return useWaitForTransactionReceipt({
      hash,
      query: { 
        enabled: !!hash,
        refetchInterval: (data) => {
          // Refetch more frequently while confirming
          return data?.status === 'success' ? false : 2000;
        }
      }
    });
  };

  const createPoll = async (title: string, options: string[]) => {
    console.log('📝 Creating poll:', title, options);
    const hash = await executeContractWrite('createPoll', [title, options]);
    
    // Dispatch event for real-time updates
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pollCreated'));
      // Refresh poll-related data
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['dailyPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
    }, 3000);
    
    return hash;
  };

  const vote = async (pollId: bigint, optionIndex: bigint) => {
    console.log('🗳️ Voting for poll:', pollId, 'option:', optionIndex);
    const hash = await executeContractWrite('vote', [pollId, optionIndex]);
    
    // Dispatch event for real-time updates
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('voteCompleted', { 
        detail: { pollId } 
      }));
      // Refresh vote-related data
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted', address, pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollInfo', pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions', pollId] });
    }, 3000);
    
    return hash;
  };

  const claimCreatorReward = async () => {
    console.log('🎁 Claiming creator rewards');
    const hash = await executeContractWrite('claimCreatorReward', []);
    
    // Dispatch event for real-time updates
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('rewardClaimed'));
      // Refresh reward-related data
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
    }, 3000);
    
    return hash;
  };

  // Real-time updates for all connected data
  useEffect(() => {
    if (!address) return;

    // Refresh all user-related data periodically
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing contract data...');
      
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['dailyPollsCreated', address] });
      
      // Invalidate all poll data
      queryClient.invalidateQueries({ queryKey: ['pollInfo'] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions'] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted'] });
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [address, queryClient]);

  // Listen for blockchain events and refresh data
  useEffect(() => {
    const handlePollCreated = () => {
      console.log('🔄 Poll created event received - refreshing data');
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
    };

    const handleVoteCompleted = (event: CustomEvent) => {
      console.log('🔄 Vote completed event received - refreshing data');
      const { pollId } = event.detail;
      
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted', address, pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollInfo', pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions', pollId] });
    };

    const handleRewardClaimed = () => {
      console.log('🔄 Reward claimed event received - refreshing data');
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
    };

    window.addEventListener('pollCreated', handlePollCreated);
    window.addEventListener('voteCompleted', handleVoteCompleted as EventListener);
    window.addEventListener('rewardClaimed', handleRewardClaimed);

    return () => {
      window.removeEventListener('pollCreated', handlePollCreated);
      window.removeEventListener('voteCompleted', handleVoteCompleted as EventListener);
      window.removeEventListener('rewardClaimed', handleRewardClaimed);
    };
  }, [address, queryClient]);

  return {
    // Odczyty
    usePollCount,
    usePollInfo,
    usePollOptions,
    useHasVoted,
    useUserBalance,
    usePendingRewards,
    useTotalPollsCreated,
    useDailyPollsCreated,
    
    // Zapisy
    createPoll,
    vote,
    claimCreatorReward,
    isCreatingPoll: isWriting,
    isVoting: isWriting,
    isClaiming: isWriting,
    
    // Transaction status
    useTransactionStatus,
    
    // Manual refresh functions
    refreshUserData: () => {
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
    },
    refreshPollData: () => {
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['pollInfo'] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions'] });
    }
  };
};