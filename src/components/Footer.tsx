import { useAppKit } from '../modules/auth';

export const Footer = () => {
  const { isConnected } = useAppKit();

  return (
    <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 w-full">
      <div className="w-full px-4 py-3">
        {/* Mobile Layout - Ultra Compact */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-xs">
                🗳️
              </div>
              <h3 className="text-white font-bold text-sm">HUB Vote</h3>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-white font-bold text-xs">🗳️</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-xs">💰</div>
              </div>
              <div className="text-center">
                <div className="text-white text-xs">
                  {isConnected ? '🟢' : '🔴'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Compact */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm">
              🗳️
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">HUB Vote</h3>
              <p className="text-white/60 text-xs">Decentralized Voting Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-white font-bold text-sm">🗳️ Vote</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">💰 Earn</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">🔒 Secure</div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-white/70 text-sm">
              {isConnected ? '🟢 Connected' : '🔴 Not Connected'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};