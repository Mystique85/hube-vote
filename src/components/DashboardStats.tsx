import React from 'react';
import type { GlobalStats } from '../hooks/useGlobalStats';

interface DashboardStatsProps {
  stats: GlobalStats | null;
  userStats: {
    pollsCreated: number;
    votesCast: number;
    tokenBalance: number;
    reputation: number;
    rank: number;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, userStats }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-300 text-xl">
            📊
          </div>
          <div>
            <h3 className="text-white font-bold">Global Statistics</h3>
            <p className="text-white/60 text-sm">
              {stats ? `Updated: ${formatDate(stats.lastUpdated)}` : 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Total Polls:</span>
            <span className="text-white font-bold">{stats ? formatNumber(stats.totalPolls) : '0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Active Polls:</span>
            <span className="text-white font-bold">{stats ? formatNumber(stats.activePolls) : '0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Total Users:</span>
            <span className="text-white font-bold">{stats ? formatNumber(stats.totalUsers) : '0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Total Votes:</span>
            <span className="text-white font-bold">{stats ? formatNumber(stats.totalVotes) : '0'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-300 text-xl">
            👤
          </div>
          <div>
            <h3 className="text-white font-bold">Your Statistics</h3>
            <p className="text-white/60 text-sm">
              {userStats.rank > 0 ? `Rank: #${userStats.rank}` : 'No ranking'}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Your Polls:</span>
            <span className="text-white font-bold">{formatNumber(userStats.pollsCreated)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Votes Cast:</span>
            <span className="text-white font-bold">{formatNumber(userStats.votesCast)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">VOTE Tokens:</span>
            <span className="text-white font-bold">{userStats.tokenBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Reputation:</span>
            <span className="text-white font-bold">{formatNumber(userStats.reputation)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-300 text-xl">
            🔥
          </div>
          <div>
            <h3 className="text-white font-bold">Recent Activity</h3>
            <p className="text-white/60 text-sm">On the platform</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-white/80 text-sm">Track real-time activity</p>
          </div>
          <div className="text-center">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('showAllPolls'))}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              View all polls →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};