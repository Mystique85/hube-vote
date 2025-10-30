import { useState, useEffect } from 'react'
import { useAppKit } from '../../auth/index'

const AVAILABLE_AVATARS = ['🐶', '🐱', '🦊', '🐯', '🐻', '🐼', '🐨', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'];

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileComplete: (profile: { nickname: string; avatar: string }) => void
}

export const UserProfileModal = ({ isOpen, onClose, onProfileComplete }: UserProfileModalProps) => {
  const { address } = useAppKit()
  const [nickname, setNickname] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🐶')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setNickname('')
      setSelectedAvatar('🐶')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (nickname.length < 3) {
      alert('Nickname must be at least 3 characters long')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call/blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Save to localStorage (temporary solution - later integrate with backend)
      const userData = {
        walletAddress: address,
        nickname,
        avatar: selectedAvatar,
        registeredAt: new Date().toISOString()
      }
      
      localStorage.setItem('hub_vote_user_profile', JSON.stringify(userData))
      
      onProfileComplete({ nickname, avatar: selectedAvatar })
      onClose()
    } catch (error) {
      console.error('Profile registration failed:', error)
      alert('Failed to register profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Complete Your Profile 🎉
          </h2>
          <p className="text-gray-600">Create your identity for HUB Vote</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-lg">⚠️</div>
            <div>
              <div className="font-semibold text-yellow-800 text-sm">Important</div>
              <div className="text-yellow-700 text-xs mt-1">
                Your nickname cannot be changed later! Choose wisely as this will be your permanent identity.
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h4 className="text-gray-800 font-semibold mb-4 text-center">Choose your avatar:</h4>
            
            <div className="grid grid-cols-8 gap-2 mb-4">
              {AVAILABLE_AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-blue-500 border-2 border-blue-400 scale-110 text-white'
                      : 'bg-gray-100 border border-gray-300 hover:scale-105 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Nickname *
            </label>
            <input 
              id="nickname"
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname..."
              maxLength={20}
              minLength={3}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {nickname.length}/20 characters
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={nickname.length < 3 || isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                'Complete Registration 🚀'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">Your profile will be stored securely on the blockchain</p>
        </div>
      </div>
    </div>
  )
}