import { useState, useEffect } from 'react'
import { useAppKit } from '../../auth'
import { useUserProfile } from '../index'
import type { UserProfile as UserProfileType } from '../index'

export function UserProfileComponent() {
  const { address, isConnected } = useAppKit()
  const { getUserProfile, createUserProfile, updateUserProfile } = useUserProfile()
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('👤')

  useEffect(() => {
    if (isConnected && address) {
      loadUserProfile()
    }
  }, [isConnected, address])

  const loadUserProfile = async () => {
    if (!address) return
    
    const profile = await getUserProfile(address)
    if (profile) {
      setUserProfile(profile)
      setNickname(profile.nickname)
      setAvatar(profile.avatar)
    } else {
      // Create default profile if doesn't exist
      const newProfile = await createUserProfile(address, `user_${address.slice(2, 8)}`, '👤')
      setUserProfile(newProfile)
      setNickname(newProfile.nickname)
      setAvatar(newProfile.avatar)
    }
  }

  const handleSave = async () => {
    if (!address) return
    
    await updateUserProfile(address, { nickname, avatar })
    setUserProfile(prev => prev ? { ...prev, nickname, avatar } : null)
    setIsEditing(false)
  }

  if (!isConnected || !userProfile) {
    return <div className="text-white">Loading profile...</div>
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-4 mb-4">
        <div className="text-4xl">{userProfile.avatar}</div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50 border border-white/30"
                placeholder="Enter nickname"
              />
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50 border border-white/30"
                placeholder="Enter emoji avatar"
              />
              <div className="flex space-x-2">
                <button 
                  onClick={handleSave}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-white">{userProfile.nickname}</h3>
              <p className="text-white/70 text-sm font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-2 text-blue-300 hover:text-blue-200 text-sm"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="text-white/70">HC Balance</div>
          <div className="text-white font-semibold">{userProfile.hcBalance}</div>
        </div>
        <div className="text-center">
          <div className="text-white/70">VOTE Balance</div>
          <div className="text-white font-semibold">{userProfile.voteBalance}</div>
        </div>
      </div>
    </div>
  )
}