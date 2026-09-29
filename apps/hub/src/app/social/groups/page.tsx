'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { vybService } from '@/lib/vyb/service';

type TabType = 'discover' | 'my-groups' | 'invites';

interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverGradient: [string, string];
  category: string;
  memberCount: number;
  onlineCount: number;
  isJoined: boolean;
  isInvited?: boolean;
  privacy: 'public' | 'private' | 'secret';
  createdBy: string;
  recentActivity?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'art', label: 'Art & Design', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'development', label: 'Development', icon: '💻' },
  { id: 'trading', label: 'Trading', icon: '📈' },
  { id: 'social', label: 'Social', icon: '💬' },
];

export default function GroupsPage() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    loadGroupsData();
  }, []);

  const loadGroupsData = async () => {
    setLoadingGroups(true);
    try {
      const [allGroupsData, invitesData] = await Promise.all([
        vybService.getGroups().catch(() => []),
        vybService.getGroupInvites().catch(() => []),
      ]);

      setGroups(allGroupsData.map(formatGroup));
      setInvites(invitesData.map((g: any) => ({ ...formatGroup(g), isInvited: true })));
    } catch (error) {
      console.warn('Could not load groups data:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const formatGroup = (g: any): Group => ({
    id: g.id,
    name: g.name,
    description: g.description || '',
    icon: g.icon || getCategoryIcon(g.category),
    coverGradient: getCategoryGradient(g.category),
    category: g.category || 'social',
    memberCount: g.memberCount || 0,
    onlineCount: g.onlineCount || 0,
    isJoined: g.isJoined || false,
    isInvited: g.isInvited,
    privacy: g.privacy || 'public',
    createdBy: g.createdBy || 'Unknown',
    recentActivity: g.recentActivity,
  });

  const getCategoryIcon = (category: string): string => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || '🏛️';
  };

  const getCategoryGradient = (category: string): [string, string] => {
    switch (category) {
      case 'gaming': return ['#00f5ff', '#bf00ff'];
      case 'art': return ['#ff6b35', '#f7c59f'];
      case 'development': return ['#00ff41', '#008f11'];
      case 'music': return ['#7b2cbf', '#c77dff'];
      case 'trading': return ['#ff4500', '#ff8c00'];
      default: return ['#6b7280', '#9ca3af'];
    }
  };

  const myGroups = groups.filter(g => g.isJoined);
  const discoverGroups = groups.filter(g => !g.isJoined);

  const filteredGroups = (activeTab === 'my-groups' ? myGroups : activeTab === 'invites' ? invites : discoverGroups)
    .filter(g => 
      (selectedCategory === 'all' || g.category === selectedCategory) &&
      (g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       g.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const formatMemberCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading || loadingGroups) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

  const tabs = [
    { id: 'discover' as TabType, label: 'Discover', icon: '🔍' },
    { id: 'my-groups' as TabType, label: 'My Groups', icon: '⭐', count: myGroups.length },
    { id: 'invites' as TabType, label: 'Invites', icon: '✉️', count: invites.length },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/social" className="text-gray-500 hover:text-neon-cyan transition-colors text-sm mb-2 inline-block">
                ← Back to VYB
              </Link>
              <h1 className="text-3xl font-grunge bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent">
                🏛️ Communities
              </h1>
              <p className="text-gray-400 text-sm mt-1">Find your tribe, build together</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="neon-button px-4 py-2 rounded-lg"
            >
              + Create Group
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white focus:border-neon-cyan/50 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-neon-purple/20 border border-neon-purple text-neon-purple'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blockchain-dark text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Categories */}
          {activeTab === 'discover' && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                      : 'bg-blockchain-light/30 border border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filteredGroups.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl text-center">
            <p className="text-4xl mb-4">🏛️</p>
            <p className="text-gray-400">
              {activeTab === 'invites' 
                ? 'No pending group invites'
                : searchQuery 
                ? 'No groups match your search'
                : 'No groups found in this category'}
            </p>
            {activeTab === 'discover' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-neon-cyan hover:underline"
              >
                Create the first one →
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredGroups.map((group) => (
              <Link
                key={group.id}
                href={`/social/groups/${group.id}`}
                className="glass-panel rounded-xl overflow-hidden hover:border-neon-purple/30 transition-all group"
              >
                {/* Cover */}
                <div 
                  className="h-24 relative"
                  style={{
                    background: `linear-gradient(135deg, ${group.coverGradient[0]}, ${group.coverGradient[1]})`
                  }}
                >
                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      group.privacy === 'public' 
                        ? 'bg-green-500/20 text-green-400'
                        : group.privacy === 'private'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {group.privacy === 'public' ? '🌐 Public' : group.privacy === 'private' ? '🔒 Private' : '👁️ Secret'}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="absolute -bottom-6 left-4">
                    <div className="w-16 h-16 rounded-xl bg-blockchain-dark border-4 border-blockchain-dark flex items-center justify-center text-3xl shadow-lg group-hover:scale-105 transition-transform">
                      {group.icon}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 pt-8">
                  <h3 className="font-grunge-alt text-xl text-white group-hover:text-neon-purple transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {group.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="text-gray-500">
                      👥 {formatMemberCount(group.memberCount)} members
                    </span>
                    <span className="text-green-400">
                      🟢 {group.onlineCount} online
                    </span>
                  </div>

                  {/* Recent Activity */}
                  {group.recentActivity && (
                    <div className="mt-3 p-2 rounded bg-blockchain-light/30 border-l-2 border-neon-purple">
                      <p className="text-gray-300 text-sm">📢 {group.recentActivity}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    {group.isJoined ? (
                      <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm border border-green-500/30">
                        ✓ Joined
                      </span>
                    ) : group.isInvited ? (
                      <>
                        <button 
                          onClick={(e) => { e.preventDefault(); }}
                          className="neon-button px-4 py-2 rounded-lg text-sm"
                        >
                          Accept Invite
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); }}
                          className="glass-panel px-4 py-2 rounded-lg text-sm text-gray-400"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={(e) => { e.preventDefault(); }}
                        className="neon-button px-4 py-2 rounded-lg text-sm"
                      >
                        Join Group
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-lg rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="font-grunge text-2xl text-neon-purple">🏛️ Create Community</h2>
              <p className="text-gray-400 text-sm mt-1">Build a space for your tribe</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-purple/50 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Description</label>
                <textarea
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-purple/50 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Category</label>
                <select className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-purple/50 focus:outline-none">
                  {CATEGORIES.slice(1).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Privacy</label>
                <div className="flex gap-2">
                  {[
                    { id: 'public', label: 'Public', icon: '🌐', desc: 'Anyone can join' },
                    { id: 'private', label: 'Private', icon: '🔒', desc: 'Request to join' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      className="flex-1 p-3 rounded-lg bg-blockchain-light/30 border border-gray-700 hover:border-neon-purple/50 transition-colors text-left"
                    >
                      <p className="text-white font-body">{opt.icon} {opt.label}</p>
                      <p className="text-gray-500 text-xs">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg"
              >
                Cancel
              </button>
              <button className="flex-1 neon-button py-2 rounded-lg">
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
