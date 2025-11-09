import { useAppKit } from './modules/auth';
import { LoginModal } from './modules/auth/components/LoginModal';
import { CreatePollModal } from './modules/polls/components/CreatePollModal';
import { useState, useEffect } from 'react';
import { useVoteContract } from './hooks/useVoteContract';
import { useWaitForTransactionReceipt } from 'wagmi';
import { HeaderComponent } from './components/HeaderComponent';
import { Footer } from './components/Footer';
import { PollListWithFilters } from './components/PollListWithFilters';
import { TransactionModal } from './components/TransactionModal';
import { UserProfileComponent } from './modules/user/components/UserProfile';
import { UserProfileModal } from './modules/user/components/UserProfileModal';
import { useUserProfile } from './hooks/useUserProfile';
import { DashboardStats } from './components/DashboardStats';
import { UserLeaderboard } from './components/UserLeaderboard';
import { useDashboardData } from './hooks/useDashboardData';
import { PollCarousel } from './components/PollCarousel';

function App() {
  const { isConnected, address } = useAppKit();
  const [showLogin, setShowLogin] = useState(true);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'all-polls' | 'my-polls' | 'completed'>('dashboard');
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [userProfileData, setUserProfileData] = useState<{ nickname: string; avatar: string } | null>(null);
  
  const { 
    userProfile, 
    isLoading: isProfileLoading, 
    createUserProfile,
    updateUserProfile 
  } = useUserProfile();
  
  const { globalStats, userStats, isLoading: isDashboardLoading } = useDashboardData();

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

  useEffect(() => {
    if (isConnected && address && !isProfileLoading && !userProfile) {
      const timer = setTimeout(() => {
        setShowUserProfileModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, userProfile, isProfileLoading]);

  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimTxHash as `0x${string}`,
  });

  useEffect(() => {
    const handleShowCreatePoll = () => setShowCreatePoll(true);
    window.addEventListener('showCreatePoll', handleShowCreatePoll);
    
    const handlePollCreated = () => {
      refetchPollCount();
      refetchTotalPolls();
      refetchPendingRewards();
    };
    
    const handleVoteCompleted = () => {
      refetchBalance();
      refetchPollCount();
    };

    const handleShowProfileModal = () => {
      setShowUserProfileModal(true);
    };

    const handleShowAllPolls = () => {
      setActiveView('all-polls');
    };

    window.addEventListener('pollCreated', handlePollCreated);
    window.addEventListener('voteCompleted', handleVoteCompleted);
    window.addEventListener('showUserProfileModal', handleShowProfileModal);
    window.addEventListener('showAllPolls', handleShowAllPolls);

    return () => {
      window.removeEventListener('showCreatePoll', handleShowCreatePoll);
      window.removeEventListener('pollCreated', handlePollCreated);
      window.removeEventListener('voteCompleted', handleVoteCompleted);
      window.removeEventListener('showUserProfileModal', handleShowProfileModal);
      window.removeEventListener('showAllPolls', handleShowAllPolls);
    };
  }, [refetchPollCount, refetchTotalPolls, refetchPendingRewards, refetchBalance]);

  useEffect(() => {
    if (isClaimConfirmed && claimTxHash) {
      refetchBalance();
      refetchPendingRewards();
      refetchTotalPolls();
      
      setShowClaimModal(false);
      setClaimTxHash(null);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showToast', { 
          detail: { message: '🎉 Reward claimed successfully!', type: 'success' } 
        }));
      }, 1000);
    }
  }, [isClaimConfirmed, claimTxHash, refetchBalance, refetchPendingRewards, refetchTotalPolls]);

  useEffect(() => {
    if (isConnected) {
      setShowLogin(false);
    }
  }, [isConnected]);

  const handleProfileComplete = async (profile: { nickname: string; avatar: string }) => {
    try {
      const createdProfile = await createUserProfile(profile.nickname, profile.avatar);
      
      setUserProfileData(profile);
      setShowUserProfileModal(false);
      
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: '🎉 Profile created successfully!', type: 'success' } 
      }));
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { 
          message: `❌ Error: ${error.message || 'Failed to create profile'}`,
          type: 'error' 
        } 
      }));
    }
  };

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
      } else {
        throw new Error('No transaction hash received');
      }
    } catch (error) {
      setShowClaimModal(false);
      setClaimTxHash(null);
      
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: '❌ Error claiming reward', type: 'error' } 
      }));
    }
  };

  if (showLogin && !isConnected) {
    return <LoginModal />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-50">
        <HeaderComponent />
      </div>

      <div className="flex-1 flex flex-col pt-16 pb-20 overflow-hidden">
        <div className="lg:hidden flex-1 overflow-hidden">
          <div className="h-full p-4 overflow-hidden">
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
                onClick={() => setActiveView('all-polls')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all text-center ${
                  activeView === 'all-polls'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-transparent text-white'
                }`}
              >
                🗳️ All
              </button>
            </div>

            <div className="h-full overflow-hidden">
              {activeView === 'dashboard' && (
                <div className="space-y-4 h-full overflow-hidden">
                  <DashboardStats stats={globalStats} userStats={userStats} />
                  <UserLeaderboard />
                </div>
              )}

              {activeView === 'all-polls' && (
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold text-lg">🗳️ All Polls</h2>
                    <button 
                      onClick={() => setActiveView('dashboard')}
                      className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <PollCarousel 
                      title="All Polls"
                      pollIds={pollIds}
                      autoPlay={false}
                      showStatus={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block flex-1 overflow-hidden">
          <div className="h-full p-6 overflow-hidden">
            <div className="grid grid-cols-4 gap-6 h-full overflow-hidden">
              <div className="col-span-1 overflow-hidden">
                <div className="flex flex-col space-y-6 h-full">
                  <UserProfileComponent />

                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-white font-bold mb-4">Navigation</h3>
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
                        onClick={() => setActiveView('all-polls')}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          activeView === 'all-polls' 
                            ? 'bg-white text-blue-600 font-semibold' 
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        🗳️ All Polls
                      </button>
                      <button
                        onClick={() => setActiveView('completed')}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          activeView === 'completed' 
                            ? 'bg-white text-blue-600 font-semibold' 
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        ✅ Completed Polls
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowCreatePoll(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-center"
                  >
                    ➕ Create Poll
                  </button>
                </div>
              </div>

              <div className="col-span-3 overflow-hidden">
                <div className="h-full">
                  {activeView === 'dashboard' && (
                    <div className="grid grid-cols-1 gap-6 h-full">
                      <div className="h-full">
                        <DashboardStats stats={globalStats} userStats={userStats} />
                      </div>
                      <div className="h-full">
                        <UserLeaderboard />
                      </div>
                    </div>
                  )}

                  {activeView === 'all-polls' && (
                    <div className="h-full flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">🗳️ All Polls</h2>
                        <button 
                          onClick={() => setActiveView('dashboard')}
                          className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
                        >
                          ← Back to Dashboard
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <PollCarousel 
                          title="All Polls"
                          pollIds={pollIds}
                          autoPlay={false}
                          showStatus={true}
                        />
                      </div>
                    </div>
                  )}

                  {activeView === 'completed' && (
                    <div className="h-full flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">✅ Completed Polls - Results</h2>
                        <button 
                          onClick={() => setActiveView('dashboard')}
                          className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
                        >
                          ← Back to Dashboard
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full content-start">
                          {pollIds.slice(0, 8).map(pollId => (
                            <div key={pollId.toString()} className="bg-white/5 rounded-xl p-6 border border-white/10">
                              <div className="text-white font-bold text-lg mb-2">Poll #{pollId.toString()}</div>
                              <div className="text-white/60 text-sm mb-4">Completed - Results available</div>
                              <button className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                📊 View Detailed Results
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Footer />
      </div>

      <CreatePollModal 
        isOpen={showCreatePoll}
        onClose={() => {
          setShowCreatePoll(false);
          setActiveView('dashboard');
        }}
      />

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
        title="Claiming Reward"
        successMessage="🎉 Reward claimed successfully!"
        pendingMessage="Waiting for transaction confirmation..."
      />

      <UserProfileModal 
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        onProfileComplete={handleProfileComplete}
        existingProfile={userProfileData || undefined}
      />
    </div>
  );
}

export default App;