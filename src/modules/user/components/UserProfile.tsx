import { useState, useEffect } from 'react'
import { useAppKit } from '../../auth/index'
import { UserProfileModal } from './UserProfileModal'

interface UserProfile {
  walletAddress: string
  nickname: string
  avatar: string
  registeredAt: string
}

export const UserProfileComponent = () => {
  const { address } = useAppKit()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    if (address) {
      // Check if user has existing profile
      const savedProfile = localStorage.getItem('hub_vote_user_profile')
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        // Verify it's the same wallet address
        if (profile.walletAddress === address) {
          setUserProfile(profile)
        } else {
          // Different wallet, show registration modal
          setShowProfileModal(true)
        }
      } else {
        // No profile found, show registration modal
        setShowProfileModal(true)
      }
    }
  }, [address])

  const handleProfileComplete = (profile: { nickname: string; avatar: string }) => {
    const userData: UserProfile = {
      walletAddress: address!,
      nickname: profile.nickname,
      avatar: profile.avatar,
      registeredAt: new Date().toISOString()
    }
    setUserProfile(userData)
    setShowProfileModal(false)
  }

  const handleEditProfile = () => {
    setShowProfileModal(true)
  }

  if (!address) return null

  if (!userProfile) {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-800 font-semibold">Profile Registration Required</p>
          <p className="text-yellow-700 text-sm mt-1">Please complete your profile to start voting</p>
        </div>
        <UserProfileModal 
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onProfileComplete={handleProfileComplete}
        />
      </>
    )
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
          {userProfile.avatar}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{userProfile.nickname}</h3>
          <p className="text-white/80 text-sm">
            {userProfile.walletAddress.slice(0, 8)}...{userProfile.walletAddress.slice(-6)}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Registered: {new Date(userProfile.registeredAt).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={handleEditProfile}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-white/30"
        >
          Edit
        </button>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white font-bold text-lg">0</div>
          <div className="text-white/80 text-xs">Polls Created</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white font-bold text-lg">0</div>
          <div className="text-white/80 text-xs">Votes Cast</div>
        </div>
      </div>
      
      <UserProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileComplete={handleProfileComplete}
      />
    </div>
  )
}