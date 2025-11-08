import { useAppKit } from '../index'
import { useState, useEffect } from 'react'
import InteractiveNetworkBackground from '../../ui/components/AnimatedCanvas'

export const LoginModal = () => {
  const { isConnected, address } = useAppKit()
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    // Automatically hide when connected
    if (isConnected && address) {
      console.log('✅ Wallet connected, hiding login modal');
      setShowWelcome(false);
    }
  }, [isConnected, address]);

  // Don't render if not showing or already connected
  if (!showWelcome || isConnected) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 z-50 overflow-hidden">
      {/* Interaktywne tło */}
      <InteractiveNetworkBackground />
      
      {/* Modal logowania */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🗳️</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">HUB Vote</h1>
          <p className="text-white/80 text-lg">Decentralized Voting Platform</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
            <span>Secure blockchain voting</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
            <span>Transparent results</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
            <span>One vote per wallet</span>
          </div>
        </div>

        <div className="flex justify-center">
          <appkit-button />
        </div>

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Connect your wallet to start voting
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center z-10">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">HUB</span>
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-light">
              © 2025 HUB Ecosystem. All rights reserved.
            </p>
            <p className="text-white/60 text-xs">
              Project by <span className="text-white font-medium">@Mysticpol</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}