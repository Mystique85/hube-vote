import { useState, useEffect } from 'react';
import { db } from '../modules/firebase';
import { doc, onSnapshot, updateDoc, setDoc, increment } from 'firebase/firestore';

export type GlobalStats = {
  totalPolls: number;
  totalUsers: number;
  totalVotes: number;
  activePolls: number;
  lastUpdated: string;
};

export const useGlobalStats = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const statsRef = doc(db, 'globalStats', 'current');
    
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GlobalStats;
        setStats(data);
        setIsLoading(false);
      } else {
        const initialStats: GlobalStats = {
          totalPolls: 0,
          totalUsers: 0,
          totalVotes: 0,
          activePolls: 0,
          lastUpdated: new Date().toISOString()
        };
        setStats(initialStats);
        setDoc(statsRef, initialStats);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const incrementVoteCount = async () => {
    try {
      const statsRef = doc(db, 'globalStats', 'current');
      await updateDoc(statsRef, {
        totalVotes: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error incrementing vote count:', error);
    }
  };

  const incrementUserCount = async () => {
    try {
      const statsRef = doc(db, 'globalStats', 'current');
      await updateDoc(statsRef, {
        totalUsers: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error incrementing user count:', error);
    }
  };

  const updateActivePolls = async (activeCount: number) => {
    try {
      const statsRef = doc(db, 'globalStats', 'current');
      await updateDoc(statsRef, {
        activePolls: activeCount,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating active polls:', error);
    }
  };

  const updatePollCount = async (newCount: number) => {
    try {
      const statsRef = doc(db, 'globalStats', 'current');
      await updateDoc(statsRef, {
        totalPolls: newCount,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating poll count:', error);
    }
  };

  useEffect(() => {
    const handleUserVoted = () => {
      incrementVoteCount();
    };

    const handlePollCreated = () => {};

    window.addEventListener('userVoted', handleUserVoted as EventListener);
    window.addEventListener('pollCreated', handlePollCreated as EventListener);
    
    return () => {
      window.removeEventListener('userVoted', handleUserVoted as EventListener);
      window.removeEventListener('pollCreated', handlePollCreated as EventListener);
    };
  }, []);

  return {
    stats,
    isLoading,
    incrementVoteCount,
    incrementUserCount,
    updateActivePolls,
    updatePollCount
  };
};