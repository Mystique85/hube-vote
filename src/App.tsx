import { useAppKit } from './modules/auth'
import { UserProfileComponent } from './modules/user/components/UserProfile'
import { LoginModal } from './modules/auth/components/LoginModal'
import { useState, useEffect } from 'react'

function App() {
  const { isConnected, disconnect } = useAppKit()
  const [showLogin, setShowLogin] = useState(true)

  useEffect(() => {
    // Reset showLogin when user disconnects
    if (!isConnected) {
      setShowLogin(true)
    }
  }, [isConnected])

  // Welcome screen
  if (showLogin && !isConnected) {
    return <LoginModal />
  }

  // Main screen when user is connected
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white text-center mb-4">HUB Vote 🗳️</h1>
        <p className="text-white/80 text-center mb-6">Decentralized Voting Platform</p>
        
        {isConnected ? (
          <div className="space-y-6">
            {/* User Profile */}
            <UserProfileComponent />
            
            {/* Actions */}
            <div className="text-center space-y-3">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full shadow-lg">
                Create Poll
              </button>
              <button className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors w-full shadow-lg">
                View Active Polls
              </button>
              <button 
                onClick={() => disconnect()}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors w-full shadow-lg"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <appkit-button />
          </div>
        )}
      </div>
    </div>
  )
}

export default App