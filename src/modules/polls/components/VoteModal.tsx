import { useState, useEffect } from 'react';
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
  const { usePollOptions, useHasVoted, vote, isVoting, voteHash } = useVoteContract();
  const { data: pollOptionsData } = usePollOptions(pollId);
  const { data: hasVoted } = useHasVoted(pollId);
  const [selectedOption, setSelectedOption] = useState<bigint | null>(null);
  const [options, setOptions] = useState<{ names: string[]; votes: bigint[] }>({ names: [], votes: [] });
  const [currentStep, setCurrentStep] = useState<'select' | 'confirming' | 'success'>('select');
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);

  // Śledzenie potwierdzenia transakcji
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  useEffect(() => {
    if (pollOptionsData) {
      const [optionNames, voteCounts] = pollOptionsData;
      setOptions({ names: optionNames, votes: voteCounts });
    }
  }, [pollOptionsData]);

  // Reset stanu kiedy modal się otwiera
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setTransactionHash(null);
      setSelectedOption(null);
    }
  }, [isOpen]);

  // Automatyczne przejście do sukcesu po potwierdzeniu
  useEffect(() => {
    if (isConfirmed && transactionHash) {
      debugLogger.walletDebug.transactionStatus(transactionHash, 'success', 'vote');
      console.log(`✅ Transakcja potwierdzona! Głos oddany w ankiecie ${pollId}`);
      setCurrentStep('success');
      
      // DODANE: Automatyczne odświeżenie po 1.5 sekundy
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('voteCompleted', { 
          detail: { pollId } 
        }));
      }, 1500);
      
      // Automatyczne zamknięcie po 3 sekundach
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [isConfirmed, transactionHash, pollId, onClose]);

  const handleVote = async () => {
    if (selectedOption === null) {
      alert('Wybierz opcję do głosowania!');
      return;
    }

    try {
      setCurrentStep('confirming');
      debugLogger.contractDebug.contractCall('vote', [pollId, selectedOption]);
      
      const hash = await vote(pollId, selectedOption);
      
      if (hash) {
        setTransactionHash(hash);
        debugLogger.walletDebug.transactionStatus(hash, 'pending', 'vote');
        console.log(`⏳ Transakcja wysłana: ${hash}`);
      } else {
        throw new Error('Brak hash transakcji');
      }
    } catch (error) {
      debugLogger.pollDebug.votingError(pollId, error, 'current-user');
      alert('Błąd podczas głosowania: ' + (error as Error).message);
      setCurrentStep('select');
      setTransactionHash(null);
    }
  };

  if (!isOpen) return null;

  // KROK 2: Czekanie na potwierdzenie transakcji
  if (currentStep === 'confirming') {
    return (
      <div className="fixed top-0 left-0 w-full h-full bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Czekam na potwierdzenie ⏳</h2>
          <p className="text-gray-600 mb-4">Transakcja została wysłana do sieci Celo...</p>
          
          {/* Pasek postępu */}
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
                🔍 Śledź transakcję na CeloScan
              </a>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-yellow-800 text-sm">
              ⏱️ <strong>Proszę czekać...</strong><br/>
              Potwierdzenie może zająć 5-15 sekund.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // KROK 3: Sukces - głosowanie potwierdzone
  if (currentStep === 'success') {
    return (
      <div className="fixed top-0 left-0 w-full h-full bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Głosowanie udane!</h2>
          <p className="text-gray-600 mb-4">Twój głos został zapisany na blockchain.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✅ +100 VOTE tokenów nagrody!
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Okno zamknie się automatycznie...
          </p>
        </div>
      </div>
    );
  }

  // KROK 1: Wybór opcji do głosowania
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Głosowanie 🗳️</h2>
        <p className="text-gray-600 mb-6">{pollTitle}</p>

        {hasVoted ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Już zagłosowałeś!</h3>
            <p className="text-gray-600">Nie możesz głosować dwa razy w tej samej ankiecie.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
            >
              Zamknij
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Wybierz opcję:</h3>
              
              {options.names.length === 0 ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Ładowanie opcji...</p>
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
                      disabled={isVoting} // 👈 Zablokuj podczas głosowania
                    />
                    <span className="flex-1 text-gray-800 font-medium">{option}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {options.votes[index]?.toString() || 0} głosów
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                💡 Za każdy głos otrzymasz <strong>100 VOTE</strong> tokenów nagrody!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isVoting} // 👈 Zablokuj podczas głosowania
                className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Anuluj
              </button>
              <button
                onClick={handleVote}
                disabled={selectedOption === null || isVoting}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isVoting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wysyłanie...
                  </div>
                ) : (
                  'Zagłosuj 🚀'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};