import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
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

  const checkNicknameAvailability = useCallback(async (nickname: string): Promise<boolean> => {
    if (!nickname || nickname.length < 3) return false;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('nickname', '==', nickname));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.empty;
    } catch (error) {
      return false;
    }
  }, []);

  const incrementGlobalUserCount = useCallback(async () => {
    try {
      const statsRef = doc(db, 'globalStats', 'current');
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        await updateDoc(statsRef, {
          totalUsers: (statsDoc.data().totalUsers || 0) + 1,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await setDoc(statsRef, {
          totalPolls: 0,
          totalUsers: 1,
          totalVotes: 0,
          activePolls: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('Global stats not initialized yet or error:', error);
    }
  }, []);

  useEffect(() => {
    if (!address || !isConnected) {
      setUserProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const userRef = doc(db, 'users', address.toLowerCase());
    
    const unsubscribe = onSnapshot(userRef, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
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
          setError('Failed to load profile');
          setIsLoading(false);
        }
      },
      (err) => {
        setError('Failed to load profile');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [address, isConnected]);

  useEffect(() => {
    if (userProfile && address) {
      updateUserStats();
    }
  }, [pollsCreated, voteBalance]);

  useEffect(() => {
    const handleUserVoted = (event: CustomEvent) => {
      if (event.detail.voter === address && userProfile) {
        const newVotesCast = (userProfile.votesCast || 0) + 1;
        updateUserProfile({
          votesCast: newVotesCast,
          reputation: (userProfile.reputation || 0) + 10,
          lastActive: new Date().toISOString()
        });
      }
    };

    window.addEventListener('userVoted', handleUserVoted as EventListener);
    return () => window.removeEventListener('userVoted', handleUserVoted as EventListener);
  }, [address, userProfile]);

  useEffect(() => {
    const handlePollCreated = () => {
      if (userProfile && address) {
        updateUserStats();
      }
    };

    window.addEventListener('pollCreated', handlePollCreated);
    return () => window.removeEventListener('pollCreated', handlePollCreated);
  }, [userProfile, address]);

  const createUserProfile = async (nickname: string, avatar: string) => {
    if (!address) throw new Error('Wallet not connected');

    const isNicknameAvailable = await checkNicknameAvailability(nickname);
    if (!isNicknameAvailable) {
      throw new Error('Nickname "' + nickname + '" is already taken. Please choose another one.');
    }

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
      
      await incrementGlobalUserCount();
      
      return profile;
    } catch (err) {
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
    }
  };

  return {
    userProfile,
    isLoading,
    error,
    createUserProfile,
    updateUserProfile,
    updateUserStats,
    checkNicknameAvailability
  };
};