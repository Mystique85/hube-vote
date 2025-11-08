import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../modules/firebase';
import { useAppKit } from '../modules/auth';
import { useVoteContract } from './useVoteContract';

export interface UserProfile {
  walletAddress: string;
  nickname: string;
  avatar: string;
  registeredAt: string;
  pollsCreated: number;
  votesCast: number;
  totalEarned: number;
  reputation: number;
  lastActive: string;
}

export const useUserProfile = () => {
  const { address, isConnected } = useAppKit();
  const { useTotalPollsCreated, useUserBalance } = useVoteContract();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: pollsCreated = 0n } = useTotalPollsCreated();
  const { data: voteBalance = 0n } = useUserBalance();

  // Load user profile from Firebase
  useEffect(() => {
    if (!address || !isConnected) {
      setUserProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const userRef = doc(db, 'users', address.toLowerCase());
    
    // Real-time listener for profile changes
    const unsubscribe = onSnapshot(userRef, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Ensure all required fields exist
            const safeProfile: UserProfile = {
              walletAddress: data.walletAddress || address,
              nickname: data.nickname || 'Anonymous',
              avatar: data.avatar || '👤',
              registeredAt: data.registeredAt || new Date().toISOString(),
              pollsCreated: data.pollsCreated || 0,
              votesCast: data.votesCast || 0,
              totalEarned: data.totalEarned || 0,
              reputation: data.reputation || 0,
              lastActive: data.lastActive || new Date().toISOString()
            };
            setUserProfile(safeProfile);
          } else {
            setUserProfile(null);
          }
          setIsLoading(false);
        } catch (err) {
          console.error('Error processing user profile:', err);
          setError('Failed to load profile');
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error loading user profile:', err);
        setError('Failed to load profile');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [address, isConnected]);

  // Sync blockchain stats with Firebase profile
  useEffect(() => {
    if (userProfile && address) {
      updateUserStats();
    }
  }, [pollsCreated, voteBalance]);

  const createUserProfile = async (nickname: string, avatar: string) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', address.toLowerCase());
      const now = new Date().toISOString();

      const profile: UserProfile = {
        walletAddress: address,
        nickname,
        avatar,
        registeredAt: now,
        lastActive: now,
        pollsCreated: 0,
        votesCast: 0,
        totalEarned: 0,
        reputation: 0
      };

      await setDoc(userRef, profile);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Failed to create user profile:', err);
      setError('Profile creation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', address.toLowerCase());
      await updateDoc(userRef, {
        ...updates,
        lastActive: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update user profile:', err);
      setError('Profile update failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStats = async () => {
    if (!address || !userProfile) return;

    try {
      const updates: Partial<UserProfile> = {
        pollsCreated: Number(pollsCreated),
        totalEarned: Number(voteBalance) / 1e18,
        lastActive: new Date().toISOString()
      };

      await updateUserProfile(updates);
    } catch (err) {
      console.error('Failed to update user stats:', err);
    }
  };

  const recordVote = async (pollId: bigint) => {
    if (!userProfile) return;

    try {
      await updateUserProfile({
        votesCast: (userProfile.votesCast || 0) + 1,
        reputation: (userProfile.reputation || 0) + 10,
        lastActive: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to record vote:', err);
    }
  };

  return {
    userProfile,
    isLoading,
    error,
    createUserProfile,
    updateUserProfile,
    updateUserStats,
    recordVote
  };
};