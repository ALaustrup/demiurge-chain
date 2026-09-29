'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Types for the Agentic Layer
interface Agent {
  id: string;
  name: string;
  did: string;
  description: string;
  autonomyLevel: 'supervised' | 'bounded' | 'autonomous' | 'sovereign';
  capabilities: string[];
  status: 'active' | 'idle' | 'suspended';
  walletBalance: number;
  totalTasks: number;
  successRate: number;
  createdAt: Date;
  lastActive: Date;
}

interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasksCompleted: number;
  totalRewardsDistributed: number;
}

type TabType = 'my-agents' | 'deploy' | 'marketplace';

// Empty initial state - real data will come from blockchain when agents are deployed
const EMPTY_METRICS: AgentMetrics = {
  totalAgents: 0,
  activeAgents: 0,
  totalTasksCompleted: 0,
  totalRewardsDistributed: 0,
};

export default function AgentsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('my-agents');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // Agents are deployed as DRC-369 NFTs with agentic metadata
  // The system starts empty — agents appear after deployment
  const agents: Agent[] = [];
  const metrics = EMPTY_METRICS;

  // Deploy form state
  const [deployForm, setDeployForm] = useState({
    name: '',
    description: '',
    autonomyLevel: 'bounded' as Agent['autonomyLevel'],
    capabilities: [] as string[],
    initialFunding: 100,
  });

  const getAutonomyColor = (level: Agent['autonomyLevel']) => {
    switch (level) {
      case 'supervised': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'bounded': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'autonomous': return 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30';
      case 'sovereign': return 'text-neon-purple bg-neon-purple/10 border-neon-purple/30';
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'idle': return 'text-yellow-400 bg-yellow-500/10';
      case 'suspended': return 'text-red-400 bg-red-500/10';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const capabilityOptions = [
    { id: 'analysis', label: '📊 Analysis', description: 'Data analysis and insights' },
    { id: 'monitoring', label: '👁️ Monitoring', description: 'Network monitoring' },
    { id: 'optimization', label: '⚡ Optimization', description: 'Performance optimization' },
    { id: 'security', label: '🛡️ Security', description: 'Security auditing' },
    { id: 'governance', label: '🏛️ Governance', description: 'Governance participation' },
    { id: 'maintenance', label: '🔧 Maintenance', description: 'System maintenance' },
    { id: 'reporting', label: '📝 Reporting', description: 'Generate reports' },
    { id: 'alerts', label: '🔔 Alerts', description: 'Issue alerts' },
  ];

  if (authLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
          <p className="text-gray-400">Loading Agentic Layer...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-8xl mb-6">🤖</div>
          <h1 className="text-5xl font-grunge mb-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-pink-500 bg-clip-text text-transparent">
            AI Agents
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Deploy and manage autonomous AI agents on Demiurge-Cloud.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
          >
            Login to Deploy Agents
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
              <span className="text-4xl">🤖</span>
              <h1 className="text-4xl md:text-5xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-purple to-pink-500 bg-clip-text text-transparent">
                AI Agents
              </h1>
            </div>
            <Link
              href="/bounties"
              className="glass-panel px-4 py-2 rounded-lg text-sm hover:border-neon-cyan/50 border border-transparent transition-all flex items-center gap-2"
            >
              <span>🎯</span>
              <span>Bounties</span>
            </Link>
          </div>
          <p className="text-gray-400">Deploy and manage autonomous AI agents on the Demiurge-Cloud</p>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-white">{metrics.totalAgents}</div>
            <div className="text-xs text-gray-400">Total Agents</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-green-400">{metrics.activeAgents}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-neon-cyan">{metrics.totalTasksCompleted.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Tasks Completed</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-2xl font-grunge text-neon-purple">{metrics.totalRewardsDistributed.toLocaleString()} CGT</div>
            <div className="text-xs text-gray-400">Rewards Earned</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('my-agents')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'my-agents'
                ? 'bg-neon-cyan/20 text-neon-cyan border-b-2 border-neon-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤖 My Agents
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'deploy'
                ? 'bg-neon-purple/20 text-neon-purple border-b-2 border-neon-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🚀 Deploy
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'marketplace'
                ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏪 Marketplace
          </button>
        </div>

        {/* My Agents Tab */}
        {activeTab === 'my-agents' && (
          <div className="space-y-4">
            {agents.length === 0 ? (
              <div className="text-center py-20 glass-panel rounded-xl">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-grunge text-white mb-2">No Agents Yet</h3>
                <p className="text-gray-400 mb-6">Deploy your first AI agent to get started</p>
                <button
                  onClick={() => setActiveTab('deploy')}
                  className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
                >
                  🚀 Deploy Your First Agent
                </button>
              </div>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="glass-panel rounded-xl p-4 md:p-6 cursor-pointer hover:border-neon-cyan/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center text-2xl">
                        🤖
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-grunge text-xl text-white">{agent.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(agent.status)}`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{agent.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-1 rounded border text-xs ${getAutonomyColor(agent.autonomyLevel)}`}>
                            {agent.autonomyLevel}
                          </span>
                          {agent.capabilities.slice(0, 3).map((cap) => (
                            <span key={cap} className="px-2 py-1 rounded bg-white/5 text-gray-400 text-xs">
                              {cap}
                            </span>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <span className="text-gray-500 text-xs">+{agent.capabilities.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="text-lg font-grunge text-neon-cyan">{agent.walletBalance} CGT</div>
                        <div className="text-xs text-gray-500">Balance</div>
                      </div>
                      <div>
                        <div className="text-lg font-grunge text-white">{agent.successRate}%</div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-grunge text-gray-300">{agent.totalTasks.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Last active {formatTimeAgo(agent.lastActive)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div className="max-w-2xl mx-auto">
            <div className="glass-panel rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-grunge text-white mb-6">🚀 Deploy New Agent</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Agent Name *</label>
                  <input
                    type="text"
                    value={deployForm.name}
                    onChange={(e) => setDeployForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-cyan focus:outline-none"
                    placeholder="MyAwesomeAgent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    value={deployForm.description}
                    onChange={(e) => setDeployForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-cyan focus:outline-none h-24 resize-none"
                    placeholder="What does this agent do?"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Autonomy Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { level: 'supervised', label: 'Supervised', desc: 'Requires approval for all actions' },
                      { level: 'bounded', label: 'Bounded', desc: 'Operates within strict limits' },
                      { level: 'autonomous', label: 'Autonomous', desc: 'Full autonomy with oversight' },
                      { level: 'sovereign', label: 'Sovereign', desc: 'Complete self-governance' },
                    ].map(({ level, label, desc }) => (
                      <button
                        key={level}
                        onClick={() => setDeployForm(prev => ({ ...prev, autonomyLevel: level as Agent['autonomyLevel'] }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          deployForm.autonomyLevel === level
                            ? getAutonomyColor(level as Agent['autonomyLevel'])
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-grunge-alt text-white">{label}</div>
                        <div className="text-xs text-gray-400">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Capabilities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {capabilityOptions.map((cap) => (
                      <button
                        key={cap.id}
                        onClick={() => {
                          setDeployForm(prev => ({
                            ...prev,
                            capabilities: prev.capabilities.includes(cap.id)
                              ? prev.capabilities.filter(c => c !== cap.id)
                              : [...prev.capabilities, cap.id],
                          }));
                        }}
                        className={`p-2 rounded-lg border text-center transition-all text-sm ${
                          deployForm.capabilities.includes(cap.id)
                            ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                            : 'border-gray-700 hover:border-gray-600 text-gray-400'
                        }`}
                      >
                        {cap.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Initial Funding (CGT)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={deployForm.initialFunding}
                      onChange={(e) => setDeployForm(prev => ({ ...prev, initialFunding: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-neon-cyan font-bold w-20 text-right">
                      {deployForm.initialFunding} CGT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Fund your agent's wallet for autonomous operations
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <button
                    disabled={!deployForm.name || deployForm.capabilities.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-grunge-alt rounded-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🚀 Deploy Agent ({deployForm.initialFunding + 50} CGT)
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    50 CGT deployment fee + initial funding
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="text-center py-20 glass-panel rounded-xl">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-grunge text-white mb-2">Agent Marketplace</h3>
            <p className="text-gray-400 mb-6">Browse and deploy pre-built agents from the community</p>
            <p className="text-neon-cyan">Coming Soon</p>
          </div>
        )}

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAgent(null)}
          >
            <div
              className="glass-panel rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center text-3xl">
                    🤖
                  </div>
                  <div>
                    <h2 className="text-2xl font-grunge text-white">{selectedAgent.name}</h2>
                    <p className="text-gray-400 text-sm font-mono">{selectedAgent.did}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-300 mb-6">{selectedAgent.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-panel rounded-lg p-4">
                  <div className="text-2xl font-grunge text-neon-cyan">{selectedAgent.walletBalance} CGT</div>
                  <div className="text-xs text-gray-400">Wallet Balance</div>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <div className="text-2xl font-grunge text-green-400">{selectedAgent.successRate}%</div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <div className="text-2xl font-grunge text-white">{selectedAgent.totalTasks.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total Tasks</div>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <div className={`text-lg font-grunge-alt ${getStatusColor(selectedAgent.status).split(' ')[0]}`}>
                    {selectedAgent.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-400">Status</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((cap) => (
                    <span key={cap} className="px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-sm">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 glass-panel rounded-lg hover:border-yellow-400/50 transition-all">
                  💰 Fund Agent
                </button>
                <button className="flex-1 py-3 glass-panel rounded-lg hover:border-neon-cyan/50 transition-all">
                  ⚙️ Configure
                </button>
                <button className="flex-1 py-3 glass-panel rounded-lg hover:border-red-400/50 text-red-400 transition-all">
                  ⏸️ Suspend
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
