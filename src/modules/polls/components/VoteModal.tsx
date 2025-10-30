import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useVoteContract } from '../../../hooks/useVoteContract';
import { debugLogger } from '../../../utils/debugLogger';
import { useWaitForTransactionReceipt } from 'wagmi';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: bigint;
  pollTitle: string;
}

export const VoteModal = ({ isOpen, onClose, pollId, pollTitle }: VoteModalProps) => {
  const { usePollOptions, useHasVoted, vote, isVoting } = useVoteContract();
  const { data: pollOptionsData } = usePollOptions(pollId);
  const { data: hasVoted } = useHasVoted(pollId);
  const [selectedOption, setSelectedOption] = useState<bigint | null>(null);
  const [options, setOptions] = useState<{ names: string[]; votes: bigint[] }>({ names: [], votes: [] });
  const [currentStep, setCurrentStep] = useState<'select' | 'confirming' | 'success'>('select');
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  useEffect(() => {
    if (pollOptionsData) {
      const [optionNames, voteCounts] = pollOptionsData;
      setOptions({ names: optionNames, votes: voteCounts });
    }
  }, [pollOptionsData]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setTransactionHash(null);
      setSelectedOption(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isConfirmed && transactionHash) {
      debugLogger.walletDebug.transactionStatus(transactionHash, 'success', 'vote');
      console.log(`✅ Transaction confirmed! Vote cast in poll ${pollId}`);
      setCurrentStep('success');
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('voteCompleted', { 
          detail: { pollId } 
        }));
      }, 1500);
      
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [isConfirmed, transactionHash, pollId, onClose]);

  const handleVote = async () => {
    if (selectedOption === null) {
      alert('Please select an option to vote!');
      return;
    }

    try {
      setCurrentStep('confirming');
      
      const hash = await vote(pollId, selectedOption);
      
      if (hash) {
        setTransactionHash(hash);
        debugLogger.walletDebug.transactionStatus(hash, 'pending', 'vote');
        console.log(`⏳ Transaction sent: ${hash}`);
      } else {
        throw new Error('No transaction hash');
      }
    } catch (error) {
      debugLogger.pollDebug.votingError(pollId, error, 'current-user');
      alert('Error during voting: ' + (error as Error).message);
      setCurrentStep('select');
      setTransactionHash(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (() => {
    if (currentStep === 'confirming') {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for confirmation ⏳</h2>
            <p className="text-gray-600 mb-4">Transaction has been sent to Celo network...</p>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
            
            {transactionHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-blue-800 text-xs break-all mb-2">
                  <strong>TX Hash:</strong> {transactionHash}
                </p>
                <a 
                  href={`https://celoscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  🔍 Track transaction on CeloScan
                </a>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-yellow-800 text-sm">
                ⏱️ <strong>Please wait...</strong><br/>
                Confirmation may take 5-15 seconds.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 'success') {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Voting successful!</h2>
            <p className="text-gray-600 mb-4">Your vote has been recorded on the blockchain.</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-semibold">
                ✅ +100 VOTE token reward!
              </p>
            </div>
            <p className="text-gray-500 text-sm">
              Window will close automatically...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Voting 🗳️</h2>
          <p className="text-gray-600 mb-6">{pollTitle}</p>

          {hasVoted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Already voted!</h3>
              <p className="text-gray-600">You cannot vote twice in the same poll.</p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Choose an option:</h3>
                
                {options.names.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading options...</p>
                  </div>
                ) : (
                  options.names.map((option, index) => (
                    <label 
                      key={index} 
                      className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedOption === BigInt(index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pollOption"
                        value={index}
                        checked={selectedOption === BigInt(index)}
                        onChange={() => setSelectedOption(BigInt(index))}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                        disabled={isVoting}
                      />
                      <span className="flex-1 text-gray-800 font-medium">{option}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {options.votes[index]?.toString() || 0} votes
                      </span>
                    </label>
                  ))
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  💡 For each vote you receive <strong>100 VOTE</strong> token reward!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isVoting}
                  className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVote}
                  disabled={selectedOption === null || isVoting}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isVoting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Vote 🚀'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  })();

  return ReactDOM.createPortal(modalContent, document.body);
};