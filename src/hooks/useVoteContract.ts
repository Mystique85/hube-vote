import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { useAppKit } from '../modules/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useVoteContract = () => {
  const { address } = useAppKit();
  const queryClient = useQueryClient();
  
  const usePollCount = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pollCount',
    query: {
      refetchInterval: 15000,
    }
  });

  const usePollInfo = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPollInfo',
    args: [pollId],
    query: { 
      enabled: pollId !== undefined,
      refetchInterval: 10000,
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

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const executeContractWrite = async (functionName: string, args: any[]) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName,
      args,
    });
    
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['dailyPollsCreated', address] });
    }, 2000);
    
    return hash;
  };

  const useTransactionStatus = (hash: `0x${string}` | undefined) => {
    return useWaitForTransactionReceipt({
      hash,
      query: { 
        enabled: !!hash,
        refetchInterval: (data) => {
          return data?.status === 'success' ? false : 2000;
        }
      }
    });
  };

  const createPoll = async (title: string, options: string[]) => {
    const hash = await executeContractWrite('createPoll', [title, options]);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pollCreated'));
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['dailyPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
    }, 3000);
    
    return hash;
  };

  const vote = async (pollId: bigint, optionIndex: bigint) => {
    const hash = await executeContractWrite('vote', [pollId, optionIndex]);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('voteCompleted', { 
        detail: { pollId } 
      }));
      window.dispatchEvent(new CustomEvent('userVoted', { 
        detail: { pollId, voter: address } 
      }));
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted', address, pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollInfo', pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions', pollId] });
    }, 3000);
    
    return hash;
  };

  const claimCreatorReward = async () => {
    const hash = await executeContractWrite('claimCreatorReward', []);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('rewardClaimed'));
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
    }, 3000);
    
    return hash;
  };

  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['dailyPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['pollInfo'] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions'] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted'] });
    }, 15000);

    return () => clearInterval(interval);
  }, [address, queryClient]);

  useEffect(() => {
    const handlePollCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['pollCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalPollsCreated', address] });
      queryClient.invalidateQueries({ queryKey: ['pendingRewards', address] });
    };

    const handleVoteCompleted = (event: CustomEvent) => {
      const { pollId } = event.detail;
      queryClient.invalidateQueries({ queryKey: ['userBalance', address] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted', address, pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollInfo', pollId] });
      queryClient.invalidateQueries({ queryKey: ['pollOptions', pollId] });
    };

    const handleRewardClaimed = () => {
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
    usePollCount,
    usePollInfo,
    usePollOptions,
    useHasVoted,
    useUserBalance,
    usePendingRewards,
    useTotalPollsCreated,
    useDailyPollsCreated,
    createPoll,
    vote,
    claimCreatorReward,
    isCreatingPoll: isWriting,
    isVoting: isWriting,
    isClaiming: isWriting,
    useTransactionStatus,
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