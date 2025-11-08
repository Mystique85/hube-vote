import { useState, useMemo } from 'react';
import { useAppKit } from '../modules/auth';

export interface PollFilters {
  active: boolean;
  ended: boolean;
  myPolls: boolean;
  voted: boolean;
  sortBy: 'newest' | 'mostVotes' | 'endingSoon';
  searchQuery: string;
}

export interface PollData {
  id: bigint;
  title: string;
  creator: string;
  ended: boolean;
  endTime: bigint;
  totalVotes: bigint;
  hasVoted?: boolean;
}

export const usePollFilters = () => {
  const { address } = useAppKit();
  const [filters, setFilters] = useState<PollFilters>({
    active: true,
    ended: false,
    myPolls: false,
    voted: false,
    sortBy: 'newest',
    searchQuery: ''
  });

  const updateFilter = <K extends keyof PollFilters>(key: K, value: PollFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      active: true,
      ended: false,
      myPolls: false,
      voted: false,
      sortBy: 'newest',
      searchQuery: ''
    });
  };

  const getActiveFilterCount = (): number => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sortBy') return value !== 'newest';
      if (key === 'searchQuery') return value !== '';
      return value === true;
    }).length;
  };

  const filterPolls = (polls: PollData[]): PollData[] => {
    if (!polls.length) return [];

    return polls.filter(poll => {
      // Status filters
      if (filters.active && !poll.ended) return true;
      if (filters.ended && poll.ended) return true;
      
      // Creator filter
      if (filters.myPolls && address && poll.creator.toLowerCase() === address.toLowerCase()) {
        return true;
      }
      
      // Voted filter
      if (filters.voted && poll.hasVoted) return true;

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = poll.title.toLowerCase().includes(query);
        const matchesId = poll.id.toString().includes(query);
        return matchesTitle || matchesId;
      }

      // Default: show active polls if no specific filters are set
      const hasSpecificFilters = filters.ended || filters.myPolls || filters.voted || filters.searchQuery;
      return !hasSpecificFilters ? !poll.ended : false;
    });
  };

  const sortPolls = (polls: PollData[]): PollData[] => {
    return [...polls].sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          // Assuming higher ID = newer poll
          return Number(b.id) - Number(a.id);
        
        case 'mostVotes':
          return Number(b.totalVotes) - Number(a.totalVotes);
        
        case 'endingSoon':
          if (a.ended && !b.ended) return 1;
          if (!a.ended && b.ended) return -1;
          if (a.ended && b.ended) return Number(b.endTime) - Number(a.endTime);
          return Number(a.endTime) - Number(b.endTime);
        
        default:
          return Number(b.id) - Number(a.id);
      }
    });
  };

  const getFilteredAndSortedPolls = (polls: PollData[]): PollData[] => {
    const filtered = filterPolls(polls);
    return sortPolls(filtered);
  };

  const getFilterSummary = (): string => {
    const parts = [];
    
    if (filters.active && !filters.ended) parts.push('Active');
    if (filters.ended && !filters.active) parts.push('Ended');
    if (filters.active && filters.ended) parts.push('All Status');
    
    if (filters.myPolls) parts.push('My Polls');
    if (filters.voted) parts.push('Voted');
    
    if (filters.searchQuery) parts.push(`"${filters.searchQuery}"`);
    
    if (parts.length === 0) return 'All Polls';
    return parts.join(' • ');
  };

  const getTimeRemainingText = (endTime: bigint): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTimeRemainingColor = (endTime: bigint): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return 'text-red-400';
    if (timeLeft < 3600) return 'text-red-400'; // Less than 1 hour
    if (timeLeft < 86400) return 'text-yellow-400'; // Less than 1 day
    return 'text-green-400';
  };

  const isPollEndingSoon = (endTime: bigint): boolean => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    return timeLeft > 0 && timeLeft < 86400; // Less than 1 day
  };

  const getPollStatus = (poll: PollData) => {
    if (poll.ended) return { text: 'Ended', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
    
    const timeLeft = Number(poll.endTime) - Math.floor(Date.now() / 1000);
    
    if (timeLeft < 3600) {
      return { text: 'Ending Soon!', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
    } else if (timeLeft < 86400) {
      return { text: 'Ending Today', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    } else {
      return { text: 'Active', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
    }
  };

  // Memoized derived state
  const activeFilterCount = useMemo(() => getActiveFilterCount(), [filters]);
  const hasActiveFilters = useMemo(() => activeFilterCount > 0, [activeFilterCount]);

  return {
    // State
    filters,
    
    // Actions
    updateFilter,
    clearFilters,
    
    // Filtering and sorting
    filterPolls,
    sortPolls,
    getFilteredAndSortedPolls,
    
    // Utility functions
    getFilterSummary,
    getTimeRemainingText,
    getTimeRemainingColor,
    isPollEndingSoon,
    getPollStatus,
    
    // Derived state
    activeFilterCount,
    hasActiveFilters,
    
    // Individual filter getters for convenience
    isActive: filters.active,
    isEnded: filters.ended,
    isMyPolls: filters.myPolls,
    isVoted: filters.voted,
    currentSort: filters.sortBy,
    searchQuery: filters.searchQuery
  };
};

// Hook for managing poll selection state
export const usePollSelection = () => {
  const [selectedPolls, setSelectedPolls] = useState<Set<bigint>>(new Set());

  const togglePollSelection = (pollId: bigint) => {
    setSelectedPolls(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(pollId)) {
        newSelection.delete(pollId);
      } else {
        newSelection.add(pollId);
      }
      return newSelection;
    });
  };

  const selectPoll = (pollId: bigint) => {
    setSelectedPolls(prev => new Set(prev).add(pollId));
  };

  const deselectPoll = (pollId: bigint) => {
    setSelectedPolls(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(pollId);
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedPolls(new Set());
  };

  const isPollSelected = (pollId: bigint): boolean => {
    return selectedPolls.has(pollId);
  };

  const getSelectedCount = (): number => {
    return selectedPolls.size;
  };

  return {
    selectedPolls: Array.from(selectedPolls),
    togglePollSelection,
    selectPoll,
    deselectPoll,
    clearSelection,
    isPollSelected,
    getSelectedCount
  };
};

// Hook for poll statistics
export const usePollStats = (polls: PollData[]) => {
  const { address } = useAppKit();

  const stats = useMemo(() => {
    const totalPolls = polls.length;
    const activePolls = polls.filter(poll => !poll.ended).length;
    const endedPolls = polls.filter(poll => poll.ended).length;
    const myPolls = address ? polls.filter(poll => poll.creator.toLowerCase() === address.toLowerCase()).length : 0;
    const votedPolls = polls.filter(poll => poll.hasVoted).length;
    
    const totalVotes = polls.reduce((sum, poll) => sum + Number(poll.totalVotes), 0);
    const averageVotes = totalPolls > 0 ? (totalVotes / totalPolls).toFixed(1) : '0';

    return {
      totalPolls,
      activePolls,
      endedPolls,
      myPolls,
      votedPolls,
      totalVotes,
      averageVotes
    };
  }, [polls, address]);

  return stats;
};

export default usePollFilters;