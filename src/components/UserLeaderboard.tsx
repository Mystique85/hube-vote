import React, { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAppKit } from '../modules/auth';

export const UserLeaderboard: React.FC = () => {
  const {
    leaderboard,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    currentUserRank,
    currentUserData,
    refreshLeaderboard
  } = useLeaderboard(10);

  const { address } = useAppKit();
  const [viewMode, setViewMode] = useState<'all' | 'me'>('all');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-400 to-gray-600';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-500 to-purple-600';
  };

  const displayLeaderboard = viewMode === 'me' && currentUserData 
    ? [currentUserData] 
    : leaderboard;

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🏆 Creator Rankings</h2>
          <div className="w-32 h-8 bg-white/20 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl animate-pulse">
              <div className="w-8 h-8 bg-white/20 rounded-full"></div>
              <div className="w-10 h-10 bg-white/20 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/20 rounded w-1/3"></div>
                <div className="h-3 bg-white/20 rounded w-1/4"></div>
              </div>
              <div className="w-16 h-6 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🏆 Creator Rankings</h2>
          <p className="text-white/60 text-sm">
            Top poll creators on the platform
            {currentUserRank > 0 && ` • Your position: #${currentUserRank}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('me')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'me'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              My Position
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by nickname or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50">
              🔍
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {displayLeaderboard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
            <p className="text-white/60 text-sm">Try changing your search criteria</p>
          </div>
        ) : (
          displayLeaderboard.map((user) => (
            <div
              key={user.walletAddress}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                user.walletAddress.toLowerCase() === address?.toLowerCase()
                  ? 'bg-green-500/20 border-green-500/30 shadow-lg scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${getRankColor(user.rank)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {getRankBadge(user.rank)}
              </div>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                  {user.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold truncate">{user.nickname}</h3>
                  <p className="text-white/60 text-xs truncate" title={user.walletAddress}>
                    {formatAddress(user.walletAddress)}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-6 text-right">
                <div>
                  <div className="text-white font-bold text-lg">{formatNumber(user.pollsCreated)}</div>
                  <div className="text-white/60 text-xs">Polls</div>
                </div>
                <div>
                  <div className="text-white font-bold text-lg">{formatNumber(user.votesCast)}</div>
                  <div className="text-white/60 text-xs">Votes</div>
                </div>
                <div>
                  <div className="text-white font-bold text-lg">{user.totalEarned.toFixed(0)}</div>
                  <div className="text-white/60 text-xs">VOTE</div>
                </div>
              </div>

              <div className="md:hidden flex items-center gap-3">
                <div className="text-right">
                  <div className="text-white font-bold text-sm">{formatNumber(user.pollsCreated)}</div>
                  <div className="text-white/60 text-xs">Polls</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {viewMode === 'all' && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20"
          >
            Next →
          </button>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-white/50 text-xs">
          📊 Rankings updated every 24 hours • 
          <button 
            onClick={refreshLeaderboard}
            className="text-blue-400 hover:text-blue-300 ml-1 underline"
          >
            Refresh now
          </button>
        </p>
      </div>
    </div>
  );
};