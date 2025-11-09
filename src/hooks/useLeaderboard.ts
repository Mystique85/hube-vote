import { useState, useEffect, useCallback } from 'react';
import { db } from '../modules/firebase';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { useUserProfile } from './useUserProfile';

export interface LeaderboardUser {
  walletAddress: string;
  nickname: string;
  avatar: string;
  pollsCreated: number;
  votesCast: number;
  totalEarned: number;
  reputation: number;
  rank: number;
}

export const useLeaderboard = (itemsPerPage: number = 10) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { userProfile } = useUserProfile();

  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 godziny

  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Sprawdź cache
      const cacheRef = doc(db, 'leaderboardCache', 'current');
      const cacheDoc = await getDoc(cacheRef);
      
      const now = new Date().getTime();
      const shouldUseCache = cacheDoc.exists() && 
        (now - cacheDoc.data().lastUpdated.toDate().getTime()) < CACHE_DURATION;

      if (shouldUseCache) {
        console.log('📊 Using cached leaderboard data');
        setLeaderboard(cacheDoc.data().users);
      } else {
        console.log('🔄 Fetching fresh leaderboard data');
        // Pobierz dane na żywo i zaktualizuj cache
        const usersRef = collection(db, 'users');
        const usersQuery = query(
          usersRef, 
          orderBy('pollsCreated', 'desc'),
          limit(100)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const usersData: LeaderboardUser[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          usersData.push({
            walletAddress: userData.walletAddress,
            nickname: userData.nickname || 'Anonymous',
            avatar: userData.avatar || '👤',
            pollsCreated: userData.pollsCreated || 0,
            votesCast: userData.votesCast || 0,
            totalEarned: userData.totalEarned || 0,
            reputation: userData.reputation || 0,
            rank: 0
          });
        });

        // Przypisz ranking
        const rankedUsers = usersData
          .sort((a, b) => b.pollsCreated - a.pollsCreated)
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }));

        // Zapisz do cache
        await setDoc(cacheRef, {
          users: rankedUsers,
          lastUpdated: new Date()
        });

        setLeaderboard(rankedUsers);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [CACHE_DURATION]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Filtrowanie i wyszukiwanie
  const filteredLeaderboard = leaderboard.filter(user =>
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginacja
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);

  // Znajdź pozycję obecnego użytkownika
  const currentUserRank = userProfile 
    ? leaderboard.findIndex(user => user.walletAddress.toLowerCase() === userProfile.walletAddress.toLowerCase()) + 1
    : -1;

  const currentUserData = userProfile 
    ? leaderboard.find(user => user.walletAddress.toLowerCase() === userProfile.walletAddress.toLowerCase())
    : null;

  const refreshLeaderboard = () => {
    fetchLeaderboardData();
  };

  return {
    leaderboard: paginatedLeaderboard,
    filteredLeaderboard,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    currentUserRank,
    currentUserData,
    refreshLeaderboard
  };
};