import { useState, useRef, useEffect } from 'react';
import { useAppKit } from '../modules/auth';
import { DonationModal } from './DonationModal';

export const HeaderComponent = () => {
  const { isConnected, address, disconnect } = useAppKit();
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatAddress = (addr: string) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleDisconnect = () => {
    disconnect();
    setShowUserDropdown(false);
    // Force reload to show login screen
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <>
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 w-full">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
                🗳️
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HUB Vote</h1>
                <p className="text-white/70 text-xs">Decentralized Voting</p>
              </div>
            </div>

            {/* Right Section - Donation Button & Wallet */}
            <div className="flex items-center space-x-3">
              {/* Donation Button */}
              <button
                onClick={() => setShowDonationModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border border-yellow-400/30 rounded-lg px-4 py-2 transition-all shadow-lg"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-yellow-600 text-xs font-bold">
                  💝
                </div>
                <span className="text-white font-medium text-sm hidden md:block">
                  Support Project
                </span>
              </button>

              {/* Wallet Connection */}
              {isConnected && address ? (
                <div className="relative" ref={dropdownRef}>
                  {/* USER MENU BUTTON */}
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-600 border border-blue-400/30 rounded-lg px-4 py-2 transition-all shadow-lg"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm backdrop-blur-sm">
                      👤
                    </div>
                    <span className="text-white font-medium text-sm hidden md:block">
                      {formatAddress(address)}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-white transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* DROPDOWN MENU - KOLOROWY */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-gradient-to-br from-blue-500/95 to-purple-600/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 py-3 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
                            👤
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">Connected Wallet</p>
                            <p className="text-white/80 text-xs font-mono truncate" title={address}>
                              {formatAddress(address)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Disconnect Button */}
                      <div className="px-2 pt-2">
                        <button 
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-3 px-3 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 text-sm font-medium border border-white/20 hover:border-white/40 group"
                        >
                          <div className="w-6 h-6 bg-red-400 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <span>Disconnect Wallet</span>
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="px-4 pt-2 border-t border-white/20 mt-2">
                        <p className="text-white/60 text-xs text-center">
                          HUB Vote 🗳️
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <appkit-button />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Donation Modal */}
      <DonationModal 
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </>
  );
};