import { useState, useEffect } from 'react'
import { useAppKit } from '../../auth'
import React from 'react'

const AVAILABLE_AVATARS = ['🐶', '🐱', '🦊', '🐯', '🐻', '🐼', '🐨', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'];

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileComplete: (profile: { nickname: string; avatar: string }) => void
  existingProfile?: { nickname: string; avatar: string }
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  onProfileComplete,
  existingProfile 
}) => {
  const { address } = useAppKit()
  const [nickname, setNickname] = useState(existingProfile?.nickname || '')
  const [selectedAvatar, setSelectedAvatar] = useState(existingProfile?.avatar || '🐶')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!existingProfile) {
        setNickname('')
        setSelectedAvatar('🐶')
      } else {
        setNickname(existingProfile.nickname)
        setSelectedAvatar(existingProfile.avatar)
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, existingProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (nickname.length < 3) {
      alert('Nickname must be at least 3 characters long')
      return
    }

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      onProfileComplete({ nickname, avatar: selectedAvatar })
    } catch (error) {
      console.error('Profile registration failed:', error)
      alert('Failed to register profile: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // CRITICAL FIX: Don't render if not open
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Modal Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-y-auto max-h-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {existingProfile ? 'Edit Profile' : 'Complete Profile'}
            </h2>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {!existingProfile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 text-lg flex-shrink-0">⚠️</div>
                  <div>
                    <div className="font-semibold text-yellow-800 text-sm">Important</div>
                    <div className="text-yellow-700 text-xs mt-1">
                      Your nickname cannot be changed later! Choose wisely.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Avatar Selection */}
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
                    disabled={isLoading}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Nickname Input */}
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
                disabled={isLoading || !!existingProfile}
                className={`w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  existingProfile 
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {nickname.length}/20 characters
                {existingProfile && (
                  <span className="text-orange-500 ml-2">• Cannot be changed</span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={nickname.length < 3 || isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {existingProfile ? 'Updating...' : 'Registering...'}
                  </div>
                ) : (
                  `${existingProfile ? 'Update' : 'Create Profile'}`
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                {existingProfile 
                  ? 'Profile stored in Firebase' 
                  : 'Profile will be stored in Firebase'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}