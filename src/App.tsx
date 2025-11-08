import { useAppKit } from './modules/auth';
import { LoginModal } from './modules/auth/components/LoginModal';
import { CreatePollModal } from './modules/polls/components/CreatePollModal';
import { useState, useEffect } from 'react';
import { useVoteContract } from './hooks/useVoteContract';
import { useWaitForTransactionReceipt } from 'wagmi';

// Komponenty
import { HeaderComponent } from './components/HeaderComponent';
import { Footer } from './components/Footer';
import { FeaturedPollSection } from './components/FeaturedPollSection';
import { PollListWithFilters } from './components/PollListWithFilters';
import { TransactionModal } from './components/TransactionModal';

function App() {
  const { isConnected, address } = useAppKit();
  const [showLogin, setShowLogin] = useState(true);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'active' | 'completed'>('dashboard');
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  
  const { 
    usePollCount, 
    useUserBalance, 
    usePendingRewards, 
    useTotalPollsCreated, 
    claimCreatorReward
  } = useVoteContract();
  
  const { data: pollCount = 0n, refetch: refetchPollCount } = usePollCount();
  const { data: balance = 0n, refetch: refetchBalance } = useUserBalance();
  const { data: pendingRewards = 0n, refetch: refetchPendingRewards } = usePendingRewards();
  const { data: totalPollsCreated = 0n, refetch: refetchTotalPolls } = useTotalPollsCreated();

  // Track transaction status
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimTxHash as `0x${string}`,
  });

  // Event listeners
  useEffect(() => {
    const handleShowCreatePoll = () => setShowCreatePoll(true);
    window.addEventListener('showCreatePoll', handleShowCreatePoll);
    
    // Listen for blockchain events
    const handlePollCreated = () => {
      console.log('🔄 Poll created - refreshing data...');
      refetchPollCount();
      refetchTotalPolls();
      refetchPendingRewards();
    };
    
    const handleVoteCompleted = () => {
      console.log('🔄 Vote completed - refreshing data...');
      refetchBalance();
      refetchPollCount();
    };

    window.addEventListener('pollCreated', handlePollCreated);
    window.addEventListener('voteCompleted', handleVoteCompleted);

    return () => {
      window.removeEventListener('showCreatePoll', handleShowCreatePoll);
      window.removeEventListener('pollCreated', handlePollCreated);
      window.removeEventListener('voteCompleted', handleVoteCompleted);
    };
  }, [refetchPollCount, refetchTotalPolls, refetchPendingRewards, refetchBalance]);

  // Auto-refresh when transaction is confirmed
  useEffect(() => {
    if (isClaimConfirmed && claimTxHash) {
      console.log('✅ Claim transaction confirmed - refreshing data...');
      
      // Refresh all relevant data
      refetchBalance();
      refetchPendingRewards();
      refetchTotalPolls();
      
      // Close modals and reset state
      setShowClaimModal(false);
      setClaimTxHash(null);
      
      // Show success message
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showToast', { 
          detail: { message: '🎉 Nagroda odebrana pomyślnie!', type: 'success' } 
        }));
      }, 1000);
    }
  }, [isClaimConfirmed, claimTxHash, refetchBalance, refetchPendingRewards, refetchTotalPolls]);

  useEffect(() => {
    if (isConnected) {
      setShowLogin(false);
    }
  }, [isConnected]);

  // Generate poll IDs
  const getAllPollIds = () => {
    if (pollCount === 0n) return [];
    
    const pollIds: bigint[] = [];
    const totalPolls = Number(pollCount);
    
    for (let i = 0; i < totalPolls; i++) {
      pollIds.push(BigInt(totalPolls - 1 - i));
    }
    
    return pollIds;
  };

  const pollIds = getAllPollIds();
  const activePolls = pollIds.slice(0, 4);

  const formatBalance = (value: bigint) => {
    return (Number(value) / 1e18).toFixed(2);
  };

  const progressToNextReward = Number(totalPollsCreated % 10n);
  const nextRewardProgress = (progressToNextReward / 10) * 100;

  const handleClaimReward = async () => {
    try {
      setShowClaimModal(true);
      const hash = await claimCreatorReward();
      
      if (hash) {
        setClaimTxHash(hash);
        console.log('⏳ Claim transaction sent:', hash);
      } else {
        throw new Error('No transaction hash received');
      }
    } catch (error) {
      console.error('❌ Error claiming reward:', error);
      setShowClaimModal(false);
      setClaimTxHash(null);
      
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: '❌ Błąd podczas odbierania nagrody', type: 'error' } 
      }));
    }
  };

  // Show login modal if not connected
  if (showLogin && !isConnected) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      {/* Header - FIXED */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <HeaderComponent />
      </div>

      {/* Main Content - fixed height, no scrolling */}
      <div className="flex-1 flex flex-col pt-16 pb-20">
        
        {/* Mobile Layout */}
        <div className="lg:hidden flex-1 overflow-hidden">
          <div className="h-full p-4">
            {/* Mobile Navigation - Top Tabs */}
            <div className="flex space-x-2 mb-4 bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all text-center ${
                  activeView === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-transparent text-white'
                }`}
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => setActiveView('active')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all text-center ${
                  activeView === 'active'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-transparent text-white'
                }`}
              >
                🗳️ Aktywne
              </button>
              <button
                onClick={() => setActiveView('completed')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all text-center ${
                  activeView === 'completed'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-transparent text-white'
                }`}
              >
                ✅ Wyniki
              </button>
            </div>

            {/* Content Area - Fixed Height, No Scroll */}
            <div className="h-[calc(100vh-200px)]">
              
              {/* DASHBOARD VIEW */}
              {activeView === 'dashboard' && (
                <div className="h-full flex flex-col space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                      <div className="text-white font-bold text-lg">{Number(pollCount)}</div>
                      <div className="text-white/80 text-xs">Ankiet</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                      <div className="text-white font-bold text-lg">{formatBalance(balance)}</div>
                      <div className="text-white/80 text-xs">VOTE</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                      <div className="text-white font-bold text-lg">{activePolls.length}</div>
                      <div className="text-white/80 text-xs">Aktywne</div>
                    </div>
                  </div>

                  {/* Featured Poll - Compact Version */}
                  <div className="flex-1 min-h-0">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 h-full">
                      <h2 className="text-white font-bold mb-3 flex items-center gap-2">
                        🌟 Wyróżniona Ankieta
                      </h2>
                      <div className="h-[calc(100%-50px)]">
                        <FeaturedPollSection />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveView('active')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      🗳️ Wszystkie Ankiety
                    </button>
                    <button 
                      onClick={() => setShowCreatePoll(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
                    >
                      ➕ Nowa Ankieta
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE POLLS VIEW */}
              {activeView === 'active' && (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold text-lg">🗳️ Aktywne Ankiety</h2>
                    <button 
                      onClick={() => setActiveView('dashboard')}
                      className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      ← Wróć
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <PollListWithFilters />
                  </div>
                </div>
              )}

              {/* COMPLETED POLLS VIEW */}
              {activeView === 'completed' && (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold text-lg">✅ Zakończone Ankiety</h2>
                    <button 
                      onClick={() => setActiveView('dashboard')}
                      className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      ← Wróć
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {pollIds.length > 0 ? (
                      pollIds.slice(0, 8).map(pollId => (
                        <div key={pollId.toString()} className="bg-white/10 rounded-xl p-4 border border-white/20">
                          <div className="text-white font-semibold">Ankieta #{pollId.toString()}</div>
                          <div className="text-white/60 text-sm mb-3">Zakończona - Wyniki dostępne</div>
                          <button className="w-full py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">
                            📊 Zobacz Wyniki
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-white/10 rounded-2xl p-6 border border-white/20">
                        <div className="text-4xl mb-3">📊</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Brak zakończonych ankiet</h3>
                        <p className="text-white/60 text-sm">Ankiety pojawią się tutaj po zakończeniu</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="grid grid-cols-4 gap-6 h-full">
              
              {/* Left Sidebar - Rozbudowany Panel Użytkownika */}
              <div className="col-span-1 flex flex-col space-y-6">
                
                {/* User Profile Card */}
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">
                      👤
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm">
                        {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Not connected'}
                      </h3>
                      <p className="text-white/60 text-xs">Connected Wallet</p>
                    </div>
                  </div>

                  {/* User Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Balans VOTE:</span>
                      <span className="text-white font-semibold text-sm">{formatBalance(balance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Utworzone ankiety:</span>
                      <span className="text-white font-semibold text-sm">{Number(totalPollsCreated)}</span>
                    </div>
                    {pendingRewards > 0n && (
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-300 text-sm">Oczekujące nagrody:</span>
                        <span className="text-yellow-300 font-semibold text-sm">{formatBalance(pendingRewards)} VOTE</span>
                      </div>
                    )}
                  </div>

                  {/* Reward Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80 text-sm">Postęp nagrody:</span>
                      <span className="text-white/60 text-xs">{progressToNextReward}/10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${nextRewardProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-white/60 text-xs text-center">
                      {10 - progressToNextReward} ankiet do nagrody 10,000 VOTE
                    </p>
                  </div>

                  {/* Claim Reward Button */}
                  {pendingRewards > 0n && (
                    <button 
                      onClick={handleClaimReward}
                      disabled={showClaimModal}
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {showClaimModal ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Odbieranie...
                        </div>
                      ) : (
                        <>
                          🎁 Odbierz {formatBalance(pendingRewards)} VOTE
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Navigation */}
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-4">Nawigacja</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        activeView === 'dashboard' 
                          ? 'bg-white text-blue-600 font-semibold' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      🏠 Dashboard
                    </button>
                    <button
                      onClick={() => setActiveView('active')}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        activeView === 'active' 
                          ? 'bg-white text-blue-600 font-semibold' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      🗳️ Aktywne Ankiety
                    </button>
                    <button
                      onClick={() => setActiveView('completed')}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        activeView === 'completed' 
                          ? 'bg-white text-blue-600 font-semibold' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      ✅ Zakończone Ankiety
                    </button>
                  </div>
                </div>

                {/* Quick Create */}
                <button 
                  onClick={() => setShowCreatePoll(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-center"
                >
                  ➕ Utwórz Ankietę
                </button>
              </div>

              {/* Main Content Area */}
              <div className="col-span-3 flex flex-col space-y-6">
                
                {/* DASHBOARD VIEW */}
                {activeView === 'dashboard' && (
                  <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                        <div className="text-white font-bold text-2xl">{Number(pollCount)}</div>
                        <div className="text-white/80 text-sm">Łącznie Ankiet</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                        <div className="text-white font-bold text-2xl">{activePolls.length}</div>
                        <div className="text-white/80 text-sm">Aktywnych</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                        <div className="text-white font-bold text-2xl">{formatBalance(balance)}</div>
                        <div className="text-white/80 text-sm">VOTE Tokenów</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                        <div className="text-white font-bold text-2xl">
                          {pendingRewards > 0n ? formatBalance(pendingRewards) : '0'}
                        </div>
                        <div className="text-white/80 text-sm">Oczekujących Nagród</div>
                      </div>
                    </div>

                    {/* Featured Poll */}
                    <div className="flex-1 min-h-0">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 h-full">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                          🌟 Wyróżniona Ankieta
                        </h2>
                        <div className="h-[calc(100%-80px)]">
                          <FeaturedPollSection />
                        </div>
                      </div>
                    </div>

                    {/* Recent Polls Quick Access */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-4">🎯 Ostatnie Aktywne Ankiety</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {activePolls.map(pollId => (
                          <div key={pollId.toString()} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="text-white font-semibold mb-2">Ankieta #{pollId.toString()}</div>
                            <button 
                              onClick={() => setActiveView('active')}
                              className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm"
                            >
                              🗳️ Zagłosuj
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ACTIVE POLLS VIEW */}
                {activeView === 'active' && (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">🗳️ Wszystkie Aktywne Ankiety</h2>
                      <button 
                        onClick={() => setActiveView('dashboard')}
                        className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
                      >
                        ← Wróć do Dashboard
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <PollListWithFilters />
                    </div>
                  </div>
                )}

                {/* COMPLETED POLLS VIEW */}
                {activeView === 'completed' && (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">✅ Zakończone Ankiety - Wyniki</h2>
                      <button 
                        onClick={() => setActiveView('dashboard')}
                        className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
                      >
                        ← Wróć do Dashboard
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {pollIds.slice(0, 8).map(pollId => (
                          <div key={pollId.toString()} className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="text-white font-bold text-lg mb-2">Ankieta #{pollId.toString()}</div>
                            <div className="text-white/60 text-sm mb-4">Zakończona - Wyniki dostępne</div>
                            <button className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                              📊 Zobacz Szczegółowe Wyniki
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - FIXED */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Footer />
      </div>

      {/* Create Poll Modal */}
      <CreatePollModal 
        isOpen={showCreatePoll}
        onClose={() => {
          setShowCreatePoll(false);
          setActiveView('dashboard');
        }}
      />

      {/* Claim Reward Transaction Modal */}
      <TransactionModal 
        isOpen={showClaimModal}
        onClose={() => {
          if (!isClaimConfirming) {
            setShowClaimModal(false);
            setClaimTxHash(null);
          }
        }}
        transactionHash={claimTxHash}
        isConfirming={isClaimConfirming}
        isConfirmed={isClaimConfirmed}
        title="Odbieranie Nagrody"
        successMessage="🎉 Nagroda odebrana pomyślnie!"
        pendingMessage="Oczekiwanie na potwierdzenie transakcji..."
      />
    </div>
  );
}

export default App;