import { useState, useEffect } from 'react';
import { useAppKit } from '../modules/auth';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const DONATION_ADDRESS = '0xd30286180E142628cc437624Ea4160d5450F73D6' as `0x${string}`;

export const DonationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { address, isConnected } = useAppKit();
  const { writeContractAsync, isPending: isSending } = useWriteContract();
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'confirming' | 'success'>('select');

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  const presetAmounts = ['0.1', '0.5', '1', '5', '10'];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setAmount('');
      setCustomAmount('');
      setTxHash(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setCurrentStep('success');
      
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [isConfirmed, txHash, onClose]);

  const handleDonate = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to send a donation');
      return;
    }

    const donateAmount = customAmount || amount;
    if (!donateAmount || parseFloat(donateAmount) <= 0) {
      alert('Please select a donation amount');
      return;
    }

    try {
      setCurrentStep('confirming');
      
      // Convert CELO to wei (CELO uses 18 decimals)
      const amountInWei = BigInt(Math.floor(parseFloat(donateAmount) * 1e18));
      
      const hash = await writeContractAsync({
        address: DONATION_ADDRESS,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'payable',
            inputs: [],
            outputs: [{ name: '', type: 'bool' }],
          }
        ],
        functionName: 'transfer',
        args: [],
        value: amountInWei,
      });
      
      if (hash) {
        setTxHash(hash);
        console.log('💰 Donation transaction sent:', hash);
      } else {
        throw new Error('No transaction hash received');
      }
    } catch (error) {
      console.error('❌ Donation error:', error);
      alert('Error sending donation: ' + (error as Error).message);
      setCurrentStep('select');
      setTxHash(null);
    }
  };

  const handleAmountSelect = (selectedAmount: string) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount('');
  };

  if (!isOpen) return null;

  if (currentStep === 'confirming') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sending Donation ⏳</h2>
          <p className="text-gray-600 mb-4">Transaction has been sent to the Celo network...</p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-yellow-500 h-2 rounded-full animate-pulse"></div>
          </div>
          
          {txHash && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
              <p className="text-yellow-800 text-xs break-all mb-2">
                <strong>TX Hash:</strong> {txHash}
              </p>
              <a 
                href={`https://celoscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 hover:text-yellow-800 text-xs underline"
              >
                🔍 Track transaction on CeloScan
              </a>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-blue-800 text-sm">
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
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">Your donation has been successfully sent.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-semibold">
              💝 Thank you for supporting the HUB Vote project!
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Support the Project 💝</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4 text-center">
            Your support helps develop the HUB Ecosystem and create better tools for the community!
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-yellow-800 text-sm text-center">
              💛 All donations are sent in CELO tokens
            </p>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="mb-6">
          <h3 className="text-gray-800 font-semibold mb-3">Select amount:</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {presetAmounts.map((presetAmount) => (
              <button
                key={presetAmount}
                onClick={() => handleAmountSelect(presetAmount)}
                className={`py-3 rounded-xl font-semibold transition-all border-2 ${
                  amount === presetAmount
                    ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {presetAmount} CELO
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Or enter custom amount:
            </label>
            <div className="relative">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.001"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                CELO
              </div>
            </div>
          </div>
        </div>

        {/* Donation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="text-center">
            <p className="text-blue-800 font-semibold text-sm mb-1">
              HUB Development Team Address:
            </p>
            <p className="text-blue-600 text-xs font-mono break-all">
              {DONATION_ADDRESS}
            </p>
            <p className="text-blue-700 text-xs mt-2">
              Donation will be sent directly to this address
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDonate}
            disabled={!isConnected || (!amount && !customAmount) || isSending}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                💝 Send Donation
              </>
            )}
          </button>
        </div>

        {/* Wallet Connection Notice */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm text-center">
              🔗 Please connect your wallet to send a donation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
