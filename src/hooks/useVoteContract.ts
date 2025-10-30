import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { useAppKit } from '../modules/auth';
import { debugLogger } from '../utils/debugLogger';
import { useQueryClient } from '@tanstack/react-query';

export const useVoteContract = () => {
  const { address } = useAppKit();
  const queryClient = useQueryClient();
  
  // Odczyt danych z kontraktu
  const usePollCount = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pollCount',
  });

  const usePollInfo = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPollInfo',
    args: [pollId],
  });

  const usePollOptions = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPollOptionsWithVotes',
    args: [pollId],
  });

  const useHasVoted = (pollId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasUserVoted',
    args: [pollId, address!],
    query: { enabled: !!address }
  });

  const useUserBalance = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  const usePendingRewards = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'pendingCreatorRewards',
    args: [address!],
    query: { enabled: !!address }
  });

  const useTotalPollsCreated = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'totalPollsCreated',
    args: [address!],
    query: { enabled: !!address }
  });

  // Zapisy do kontraktu - POPRAWIONE: użyj writeContractAsync dla hash'a
  const { writeContractAsync: createPollWrite, isPending: isCreatingPoll } = useWriteContract();
  const { writeContractAsync: voteWrite, isPending: isVoting } = useWriteContract();
  const { writeContractAsync: claimRewardWrite, isPending: isClaiming } = useWriteContract();

  const createPoll = async (title: string, options: string[]) => {
    debugLogger.contractDebug.contractCall('createPoll', [title, options]);
    try {
      const hash = await createPollWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createPoll',
        args: [title, options],
      });
      debugLogger.walletDebug.transactionStatus(hash, 'pending', 'createPoll');
      return hash;
    } catch (error) {
      debugLogger.contractError('createPoll', error, address);
      throw error;
    }
  };

  const vote = async (pollId: bigint, optionIndex: bigint) => {
    debugLogger.contractDebug.contractCall('vote', [pollId, optionIndex]);
    try {
      const hash = await voteWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'vote',
        args: [pollId, optionIndex],
      });
      debugLogger.walletDebug.transactionStatus(hash, 'pending', 'vote');
      return hash;
    } catch (error) {
      debugLogger.contractError('vote', error, address);
      throw error;
    }
  };

  const claimCreatorReward = async () => {
    debugLogger.contractDebug.contractCall('claimCreatorReward', []);
    try {
      const hash = await claimRewardWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimCreatorReward',
      });
      debugLogger.walletDebug.transactionStatus(hash, 'pending', 'claimCreatorReward');
      return hash;
    } catch (error) {
      debugLogger.contractError('claimCreatorReward', error, address);
      throw error;
    }
  };

  return {
    // Odczyty
    usePollCount,
    usePollInfo,
    usePollOptions,
    useHasVoted,
    useUserBalance,
    usePendingRewards,
    useTotalPollsCreated,
    
    // Zapisy
    createPoll,
    isCreatingPoll,
    vote,
    isVoting,
    claimCreatorReward,
    isClaiming,
  };
};