import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export interface UserProfile {
  nickname: string
  avatar: string
  createdAt: Date
  hcBalance: number
  voteBalance: number
  pollsCreated: number
  votesCast: number
  reputation: number
}

export const useUserProfile = () => {
  const createUserProfile = async (walletAddress: string, nickname: string, avatar: string = '👤') => {
    const userRef = doc(db, 'users', walletAddress.toLowerCase())
    
    const userProfile: UserProfile = {
      nickname,
      avatar,
      createdAt: new Date(),
      hcBalance: 0,
      voteBalance: 0,
      pollsCreated: 0,
      votesCast: 0,
      reputation: 0
    }

    await setDoc(userRef, userProfile)
    return userProfile
  }

  const getUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', walletAddress.toLowerCase())
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile
    }
    return null
  }

  const updateUserProfile = async (walletAddress: string, updates: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', walletAddress.toLowerCase())
    await updateDoc(userRef, updates)
  }

  return {
    createUserProfile,
    getUserProfile,
    updateUserProfile
  }
}

// Eksport typu dla komponentów
export type { UserProfile }