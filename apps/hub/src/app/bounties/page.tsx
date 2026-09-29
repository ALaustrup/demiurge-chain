'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Types for the Bounty System
interface Bounty {
  id: string;
  title: string;
  description: string;
  category: 'optimization' | 'security' | 'analysis' | 'maintenance' | 'governance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'verification' | 'completed' | 'expired';
  reward: number;
  deadline: Date;
  creator: string;
  assignee?: string;
  bidsCount: number;
  requiredCapabilities: string[];
  createdAt: Date;
}

interface BountyMetrics {
  totalBounties: number;
  openBounties: number;
  completedBounties: number;
  totalRewardsPool: number;
}

type TabType = 'browse' | 'my-bids' | 'create';
type FilterCategory = 'all' | Bounty['category'];
type FilterPriority = 'all' | Bounty['priority'];

// Empty initial state - real bounties will come from blockchain via Sentinel Oracle
const EMPTY_METRICS: BountyMetrics = {
  totalBounties: 0,
  openBounties: 0,
  completedBounties: 0,
  totalRewardsPool: 0,
};

export default function BountiesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');

  // Bounties are managed through the Sentinel Oracle system
  // The list starts empty — bounties appear when posted by users
  const bounties: Bounty[] = [];
  const metrics = EMPTY_METRICS;

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'optimization' as Bounty['category'],
    priority: 'medium' as Bounty['priority'],
    reward: 100,
    deadlineDays: 7,
    requiredCapabilities: [] as string[],
  });

  const getCategoryColor = (category: Bounty['category']) => {
    switch (category) {
      case 'optimization': return 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30';
      case 'security': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'analysis': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'maintenance': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'governance': return 'text-neon-purple bg-neon-purple/10 border-neon-purple/30';
    }
  };

  const getCategoryIcon = (category: Bounty['category']) => {
    switch (category) {
      case 'optimization': return '⚡';
      case 'security': return '🛡️';
      case 'analysis': return '📊';
      case 'maintenance': return '🔧';
      case 'governance': return '🏛️';
    }
  };

  const getPriorityColor = (priority: Bounty['priority']) => {
    switch (priority) {
      case 'low': return 'text-gray-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
    }
  };

  const getStatusColor = (status: Bounty['status']) => {
    switch (status) {
      case 'open': return 'text-green-400 bg-green-500/10';
      case 'assigned': return 'text-blue-400 bg-blue-500/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/10';
      case 'verification': return 'text-neon-purple bg-neon-purple/10';
      case 'completed': return 'text-neon-cyan bg-neon-cyan/10';
      case 'expired': return 'text-gray-400 bg-gray-500/10';
    }
  };

  const formatTimeRemaining = (deadline: Date) => {
    const diff = deadline.getTime() - Date.now();
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const filteredBounties = bounties.filter(bounty => {
    if (filterCategory !== 'all' && bounty.category !== filterCategory) return false;
    if (filterPriority !== 'all' && bounty.priority !== filterPriority) return false;
    return true;
  });

  const capabilityOptions = [
    { id: 'analysis', label: '📊 Analysis' },
    { id: 'monitoring', label: '👁️ Monitoring' },
    { id: 'optimization', label: '⚡ Optimization' },
    { id: 'security', label: '🛡️ Security' },
    { id: 'governance', label: '🏛️ Governance' },
    { id: 'maintenance', label: '🔧 Maintenance' },
    { id: 'reporting', label: '📝 Reporting' },
  ];

  if (authLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
          <p className="text-gray-400">Loading Bounty Marketplace...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-8xl mb-6">🎯</div>
          <h1 className="text-5xl font-grunge mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            Bounty Marketplace
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Complete tasks for the Sentinel Oracle and earn CGT rewards.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
          >
            Login to Hunt Bounties
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎯</span>
              <h1 className="text-4xl md:text-5xl font-grunge bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
                Bounty Marketplace
              </h1>
            </div>
            <Link
              href="/agents"
              className="glass-panel px-4 py-2 rounded-lg text-sm hover:border-neon-cyan/50 border border-transparent transition-all flex items-center gap-2"
            >
              <span>🤖</span>
              <span>AI Agents</span>
            </Link>
          </div>
          <p className="text-gray-400">Complete tasks from the Sentinel Oracle and earn CGT rewards</p>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-white">{metrics.totalBounties}</div>
            <div className="text-xs text-gray-400">Total Bounties</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-green-400">{metrics.openBounties}</div>
            <div className="text-xs text-gray-400">Open</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-neon-cyan">{metrics.completedBounties}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-yellow-400">{metrics.totalRewardsPool.toLocaleString()} CGT</div>
            <div className="text-xs text-gray-400">Rewards Pool</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'browse'
                ? 'bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 Browse Bounties
          </button>
          <button
            onClick={() => setActiveTab('my-bids')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'my-bids'
                ? 'bg-neon-cyan/20 text-neon-cyan border-b-2 border-neon-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 My Bids
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'create'
                ? 'bg-neon-purple/20 text-neon-purple border-b-2 border-neon-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ➕ Create Bounty
          </button>
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="optimization">⚡ Optimization</option>
                  <option value="security">🛡️ Security</option>
                  <option value="analysis">📊 Analysis</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="governance">🏛️ Governance</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
            </div>

            {/* Bounty List */}
            <div className="space-y-4">
              {filteredBounties.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-xl">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-grunge text-white mb-2">No Bounties Found</h3>
                  <p className="text-gray-400">Try adjusting your filters</p>
                </div>
              ) : (
                filteredBounties.map((bounty) => (
                  <div
                    key={bounty.id}
                    onClick={() => setSelectedBounty(bounty)}
                    className="glass-panel rounded-xl p-4 md:p-6 cursor-pointer hover:border-yellow-400/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded border text-xs ${getCategoryColor(bounty.category)}`}>
                            {getCategoryIcon(bounty.category)} {bounty.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(bounty.status)}`}>
                            {bounty.status.replace('_', ' ')}
                          </span>
                          <span className={`text-xs ${getPriorityColor(bounty.priority)}`}>
                            {bounty.priority.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-grunge text-xl text-white mb-1">{bounty.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{bounty.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-gray-500">by {bounty.creator}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">{bounty.bidsCount} bids</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-2xl font-grunge text-yellow-400">{bounty.reward} CGT</div>
                          <div className="text-xs text-gray-500">Reward</div>
                        </div>
                        <div>
                          <div className={`text-lg font-grunge ${bounty.deadline.getTime() < Date.now() ? 'text-red-400' : 'text-white'}`}>
                            {formatTimeRemaining(bounty.deadline)}
                          </div>
                          <div className="text-xs text-gray-500">Remaining</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* My Bids Tab */}
        {activeTab === 'my-bids' && (
          <div className="text-center py-20 glass-panel rounded-xl">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-grunge text-white mb-2">No Active Bids</h3>
            <p className="text-gray-400 mb-6">Browse bounties and submit your first bid</p>
            <button
              onClick={() => setActiveTab('browse')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
            >
              🎯 Browse Bounties
            </button>
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="glass-panel rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-grunge text-white mb-6">➕ Create New Bounty</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Title *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                    placeholder="Optimize transaction throughput..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description *</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none h-32 resize-none"
                    placeholder="Describe the task in detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value as Bounty['category'] }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="optimization">⚡ Optimization</option>
                      <option value="security">🛡️ Security</option>
                      <option value="analysis">📊 Analysis</option>
                      <option value="maintenance">🔧 Maintenance</option>
                      <option value="governance">🏛️ Governance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as Bounty['priority'] }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="low">⚪ Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="critical">🔴 Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Required Capabilities</label>
                  <div className="flex flex-wrap gap-2">
                    {capabilityOptions.map((cap) => (
                      <button
                        key={cap.id}
                        onClick={() => {
                          setCreateForm(prev => ({
                            ...prev,
                            requiredCapabilities: prev.requiredCapabilities.includes(cap.id)
                              ? prev.requiredCapabilities.filter(c => c !== cap.id)
                              : [...prev.requiredCapabilities, cap.id],
                          }));
                        }}
                        className={`px-3 py-1 rounded border text-sm transition-all ${
                          createForm.requiredCapabilities.includes(cap.id)
                            ? 'border-yellow-400 bg-yellow-500/10 text-yellow-400'
                            : 'border-gray-700 hover:border-gray-600 text-gray-400'
                        }`}
                      >
                        {cap.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Reward (CGT)</label>
                    <input
                      type="number"
                      min="10"
                      value={createForm.reward}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Deadline (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={createForm.deadlineDays}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, deadlineDays: parseInt(e.target.value) || 7 }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <button
                    disabled={!createForm.title || !createForm.description || createForm.reward < 10}
                    className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🎯 Create Bounty ({createForm.reward} CGT)
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Reward will be locked until bounty is completed or expires
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bounty Detail Modal */}
        {selectedBounty && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBounty(null)}
          >
            <div
              className="glass-panel rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded border text-xs ${getCategoryColor(selectedBounty.category)}`}>
                    {getCategoryIcon(selectedBounty.category)} {selectedBounty.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedBounty.status)}`}>
                    {selectedBounty.status.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBounty(null)}
                  className="w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
                >
                  ×
                </button>
              </div>

              <h2 className="text-2xl font-grunge text-white mb-2">{selectedBounty.title}</h2>
              <p className="text-gray-400 mb-6">{selectedBounty.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-panel rounded-lg p-4">
                  <div className="text-2xl font-grunge text-yellow-400">{selectedBounty.reward} CGT</div>
                  <div className="text-xs text-gray-400">Reward</div>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <div className={`text-2xl font-grunge ${selectedBounty.deadline.getTime() < Date.now() ? 'text-red-400' : 'text-white'}`}>
                    {formatTimeRemaining(selectedBounty.deadline)}
                  </div>
                  <div className="text-xs text-gray-400">Remaining</div>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <div className="text-2xl font-grunge text-neon-cyan">{selectedBounty.bidsCount}</div>
                  <div className="text-xs text-gray-400">Bids</div>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <div className={`text-lg font-grunge-alt ${getPriorityColor(selectedBounty.priority)}`}>
                    {selectedBounty.priority.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-400">Priority</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-2">Required Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBounty.requiredCapabilities.map((cap) => (
                    <span key={cap} className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6 text-sm text-gray-500">
                <p>Created by <span className="text-neon-cyan">{selectedBounty.creator}</span></p>
                {selectedBounty.assignee && (
                  <p>Assigned to <span className="text-neon-purple">{selectedBounty.assignee}</span></p>
                )}
              </div>

              {selectedBounty.status === 'open' && (
                <button className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-[1.02] transition-all">
                  📝 Submit Bid
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
