import { useState, useEffect } from 'react';
import { useVoteContract } from '../../../hooks/useVoteContract';
import { debugLogger } from '../../../utils/debugLogger';
import { useWaitForTransactionReceipt } from 'wagmi';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePollModal = ({ isOpen, onClose }: CreatePollModalProps) => {
  const { createPoll, isCreatingPoll, createPollHash } = useVoteContract();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirming' | 'success'>('form');
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);

  // Śledzenie potwierdzenia transakcji
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  // Reset stanu kiedy modal się otwiera
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('form');
      setTransactionHash(null);
    }
  }, [isOpen]);

  // Automatyczne przejście do sukcesu po potwierdzeniu
  useEffect(() => {
    if (isConfirmed && transactionHash) {
      debugLogger.walletDebug.transactionStatus(transactionHash, 'success', 'createPoll');
      console.log(`✅ Transakcja potwierdzona! Ankieta utworzona`);
      setCurrentStep('success');
      
      // Automatyczne odświeżenie po 1.5 sekundy
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pollCreated'));
      }, 1500);
      
      // Automatyczne zamknięcie po 3 sekundach
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  }, [isConfirmed, transactionHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim().length === 0) {
      alert('Proszę wprowadzić tytuł ankiety');
      return;
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Ankieta musi mieć przynajmniej 2 opcje');
      return;
    }

    try {
      setCurrentStep('confirming');
      debugLogger.contractDebug.contractCall('createPoll', [title, validOptions]);
      
      const hash = await createPoll(title, validOptions);
      
      if (hash) {
        setTransactionHash(hash);
        debugLogger.walletDebug.transactionStatus(hash, 'pending', 'createPoll');
        console.log(`⏳ Transakcja wysłana: ${hash}`);
      } else {
        throw new Error('Brak hash transakcji');
      }
    } catch (error) {
      debugLogger.pollDebug.creationError(error, 'current-user');
      alert('Błąd podczas tworzenia ankiety: ' + (error as Error).message);
      setCurrentStep('form');
      setTransactionHash(null);
    }
  };

  const handleClose = () => {
    setTitle('');
    setOptions(['', '']);
    setCurrentStep('form');
    setTransactionHash(null);
    onClose();
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (!isOpen) return null;

  // KROK 2: Czekanie na potwierdzenie transakcji
  if (currentStep === 'confirming') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tworzenie ankiety ⏳</h2>
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

  // KROK 3: Sukces - ankieta utworzona
  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ankieta utworzona!</h2>
          <p className="text-gray-600 mb-4">Twoja ankieta została zapisana na blockchain.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✅ +1 do progresu nagrody!
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            Okno zamknie się automatycznie...
          </p>
        </div>
      </div>
    );
  }

  // KROK 1: Formularz tworzenia ankiety
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Utwórz nową ankietę 🗳️</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tytuł ankiety *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. 'Jaki jest Twój ulubiony kolor?'"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Opcje odpowiedzi *
              </label>
              <span className="text-sm text-gray-500">
                {options.filter(opt => opt.trim().length > 0).length}/10
              </span>
            </div>
            
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opcja ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 w-full py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              >
                + Dodaj opcję
              </button>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              💡 Możesz utworzyć maksymalnie 20 ankiet dziennie. Za każde 10 utworzonych ankiet otrzymasz nagrodę 10,000 VOTE!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreatingPoll}
              className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isCreatingPoll}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isCreatingPoll ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Wysyłanie...
                </div>
              ) : (
                'Utwórz ankietę 🚀'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};