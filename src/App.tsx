import { useAppKit } from './modules/auth'
import { UserProfileComponent } from './modules/user/components/UserProfile'
import { LoginModal } from './modules/auth/components/LoginModal'
import { PollList } from './modules/polls/components/PollList'
import { CreatePollModal } from './modules/polls/components/CreatePollModal'
import { useState, useEffect } from 'react'
import { useVoteContract } from './hooks/useVoteContract'
import { debugLogger } from './utils/debugLogger' // 👈 Dodaj ten import

function App() {
  const { isConnected, disconnect, address } = useAppKit()
  const [showLogin, setShowLogin] = useState(true)
  const [showCreatePoll, setShowCreatePoll] = useState(false)
  const { useUserBalance, usePendingRewards } = useVoteContract()
  
  const { data: balance = 0n } = useUserBalance()
  const { data: pendingRewards = 0n } = usePendingRewards()

  // 👇 GLOBALNE DEBUG LOGI - zawsze działają
  useEffect(() => {
    if (address) {
      debugLogger.walletDebug.connection(address, isConnected);
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (address && balance !== undefined) {
      debugLogger.walletDebug.balanceUpdate(address, balance, 'VOTE');
    }
  }, [address, balance]);

  useEffect(() => {
    if (address && pendingRewards !== undefined) {
      debugLogger.rewardDebug.pendingRewards(address, pendingRewards, 0n); // totalPollsCreated tymczasowo 0
    }
  }, [address, pendingRewards]);

  useEffect(() => {
    if (!isConnected) {
      setShowLogin(true)
    }
  }, [isConnected])

  if (showLogin && !isConnected) {
    return <LoginModal />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">HUB Vote 🗳️</h1>
            <p className="text-white/80">Decentralized Voting Platform on Celo</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-3 text-white">
              <div className="text-sm">Balance</div>
              <div className="font-bold">{(Number(balance) / 1e18).toFixed(2)} VOTE</div>
            </div>
            {Number(pendingRewards) > 0 && (
              <div className="bg-yellow-500/20 rounded-xl p-3 text-yellow-300 border border-yellow-500/30">
                <div className="text-sm">Pending Rewards</div>
                <div className="font-bold">{(Number(pendingRewards) / 1e18).toFixed(2)} VOTE</div>
              </div>
            )}
          </div>
        </div>
        
        {isConnected ? (
          <div className="space-y-8">
            {/* User Profile */}
            <UserProfileComponent />
            
            {/* Poll Actions */}
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCreatePoll(true)}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                ➕ Create New Poll
              </button>
              {Number(pendingRewards) > 0 && (
                <button className="px-6 py-4 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-all shadow-lg">
                  🎁 Claim Reward ({(Number(pendingRewards) / 1e18).toFixed(2)} VOTE)
                </button>
              )}
            </div>

            {/* Polls List */}
            <PollList />

            {/* Disconnect */}
            <div className="text-center">
              <button 
                onClick={() => disconnect()}
                className="px-6 py-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <appkit-button />
          </div>
        )}
      </div>

      <CreatePollModal 
        isOpen={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
        onPollCreated={() => {
          setShowCreatePoll(false);
          debugLogger.contractDebug.contractCall('createPoll', [], 'pending');
        }}
      />
    </div>
  )
}

export default App