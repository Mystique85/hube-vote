import { AnimatedCanvas } from '../../../modules/ui/components/AnimatedCanvas'

export function LoginModal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Canvas Background */}
      <AnimatedCanvas />
      
      {/* Content */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full relative z-10 transform transition-all duration-500 hover:scale-105">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🗳️</div>
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            HUB Vote
          </h1>
          <p className="text-white/80 text-lg">Decentralized Voting Platform</p>
        </div>

        {/* Features list */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 text-white/90">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Vote anonymously on important decisions</span>
          </div>
          <div className="flex items-center space-x-3 text-white/90">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Earn VOTE tokens for participation</span>
          </div>
          <div className="flex items-center space-x-3 text-white/90">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Create polls with HC token requirements</span>
          </div>
        </div>

        {/* Connect Button */}
        <div className="flex justify-center">
          <appkit-button />
        </div>

        {/* Info text */}
        <p className="text-white/60 text-center mt-6 text-sm">
          Connect your wallet to start voting
        </p>
      </div>
    </div>
  )
}