import { useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: `0x${string}` | null;
  isConfirming: boolean;
  isConfirmed: boolean;
  title: string;
  successMessage: string;
  pendingMessage: string;
}

export const TransactionModal = ({ 
  isOpen, 
  onClose, 
  transactionHash, 
  isConfirming, 
  isConfirmed, 
  title,
  successMessage,
  pendingMessage
}: TransactionModalProps) => {
  
  useEffect(() => {
    if (isConfirmed) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, onClose]);

  if (!isOpen) return null;

  if (isConfirmed) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✅ Transaction confirmed!
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
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title} ⏳</h2>
        <p className="text-gray-600 mb-4">{pendingMessage}</p>
        
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
};