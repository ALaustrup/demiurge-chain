'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useVYB } from '@/contexts/VYBContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Feed, 
  ProfileCard, 
  ProfileCustomizer, 
  NotificationsPanel,
  MediaGallery,
  Messages,
  ServiceMarketplace,
  TopFriends,
} from '@/components/vyb';
import { ChatLayout } from '@/components/vyb/chat';
import { vybService } from '@/lib/vyb/service';

type TabType = 'feed' | 'messages' | 'gallery' | 'services' | 'notifications' | 'chat';

interface OnlineFriend {
  id: string;
  name: string;
  icon: string;
  status: string;
}

interface UserGroup {
  name: string;
  icon: string;
  members: number;
}

export default function SocialPage() {
  const { user } = useAuth();
  const { profile, unreadMessageCount, unreadNotificationCount } = useVYB();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([]);
  const [myGroups, setMyGroups] = useState<UserGroup[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ cgt: 0, friends: 0, likes: 0, tips: 0 });
  const [trending, setTrending] = useState<{ tag: string; posts: number }[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<{ name: string; time: string; type: string }[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);

  // NOTE: No redirect needed - AuthGate ensures users are authenticated before reaching this page

  // Load sidebar data
  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadSidebarData = async () => {
    setLoadingSidebar(true);
    try {
      const [friendsData, groupsData, statsData, trendingData, eventsData] = await Promise.all([
        vybService.getOnlineFriends().catch(() => []),
        vybService.getUserGroups().catch(() => []),
        vybService.getWeeklyStats().catch(() => ({ cgt: 0, friends: 0, likes: 0, tips: 0 })),
        vybService.getTrending().catch(() => []),
        vybService.getUpcomingEvents(3).catch(() => []),
      ]);

      setOnlineFriends(friendsData.map((f: any) => ({
        id: f.id,
        name: f.displayName,
        icon: f.avatar || '👤',
        status: f.status || 'Online',
      })));

      setMyGroups(groupsData.map((g: any) => ({
        name: g.name,
        icon: g.icon || '🏛️',
        members: g.memberCount || 0,
      })));

      setWeeklyStats(statsData);
      setTrending(trendingData);
      setUpcomingEvents(eventsData.map((e: any) => ({
        name: e.title,
        time: formatEventTime(e.date),
        type: e.type,
      })));
    } catch (error) {
      console.warn('Could not load sidebar data:', error);
    } finally {
      setLoadingSidebar(false);
    }
  };

  const formatEventTime = (date: string | number): string => {
    const eventDate = new Date(date);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) {
      if (hours <= 0) return 'Starting soon';
      return `Today ${eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (days === 1) return `Tomorrow ${eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    return eventDate.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  };

  // NOTE: No loading/auth checks needed - AuthGate handles authentication before this page loads

  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'feed', label: 'Feed', icon: '🌐' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'messages', label: 'Messages', icon: '✉️', badge: unreadMessageCount },
    { id: 'gallery', label: 'Gallery', icon: '📸' },
    { id: 'services', label: 'Services', icon: '🛠️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadNotificationCount },
  ];

  // Quick navigation items - counts will be loaded dynamically
  const quickNav = [
    { href: '/social/friends', icon: '👥', label: 'Friends', count: profile?.stats?.following },
    { href: '/social/groups', icon: '🏛️', label: 'Groups' },
    { href: '/social/events', icon: '📅', label: 'Events' },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-grunge bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                VYB
              </h1>
              <p className="text-gray-400 font-body">Your On-Chain Social Network</p>
            </div>
            <div className="flex items-center gap-3">
              <ProfileCustomizer />
              <Link 
                href="/settings" 
                className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors"
              >
                ⚙️
              </Link>
            </div>
          </div>

          {/* Quick Navigation Bar */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {quickNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blockchain-light/30 border border-gray-700 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all whitespace-nowrap group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-gray-300 text-sm group-hover:text-white">{item.label}</span>
                {item.count !== undefined && (
                  <span className="text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-blockchain-dark border border-b-0 border-gray-800 text-white -mb-px'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="hidden lg:block space-y-6">
              <ProfileCard />
              
              {/* Online Friends */}
              <div className="glass-panel p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-grunge-alt text-lg text-green-400 flex items-center gap-2">
                    🟢 Online
                  </h3>
                  <span className="text-gray-500 text-xs">{onlineFriends.length} friends</span>
                </div>
                {loadingSidebar ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : onlineFriends.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No friends online</p>
                ) : (
                  <div className="space-y-3">
                    {onlineFriends.map((friend) => (
                      <Link
                        key={friend.id}
                        href={`/social/profile/${friend.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-lg">
                            {friend.icon}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-blockchain-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm group-hover:text-neon-cyan transition-colors truncate">
                            {friend.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">{friend.status}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link 
                  href="/social/friends"
                  className="block text-center text-neon-cyan text-sm mt-4 hover:underline"
                >
                  See all friends →
                </Link>
              </div>

              {/* My Groups */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-purple mb-4 flex items-center gap-2">
                  🏛️ My Groups
                </h3>
                {loadingSidebar ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : myGroups.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No groups joined yet</p>
                ) : (
                  <div className="space-y-2">
                    {myGroups.map((group, i) => (
                      <Link
                        key={i}
                        href={`/social/groups/${i+1}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/50 to-neon-cyan/50 flex items-center justify-center">
                          {group.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm group-hover:text-neon-purple transition-colors truncate">
                            {group.name}
                          </p>
                          <p className="text-gray-500 text-xs">{group.members} members</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link 
                  href="/social/groups"
                  className="block text-center text-neon-purple text-sm mt-4 hover:underline"
                >
                  Browse groups →
                </Link>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-2">
              <Feed />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">📊 This Week</h3>
                {loadingSidebar ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-5 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">CGT Earned</span>
                      <span className="text-green-400 font-grunge">
                        {weeklyStats.cgt > 0 ? `+${weeklyStats.cgt}` : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">New Friends</span>
                      <span className="text-blue-400 font-grunge">
                        {weeklyStats.friends > 0 ? `+${weeklyStats.friends}` : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Post Likes</span>
                      <span className="text-pink-400 font-grunge">
                        {weeklyStats.likes > 0 ? `+${weeklyStats.likes}` : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Tips Received</span>
                      <span className="text-yellow-400 font-grunge">
                        {weeklyStats.tips > 0 ? `+${weeklyStats.tips} CGT` : '0'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trending */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">🔥 Trending</h3>
                {loadingSidebar ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : trending.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No trending topics yet</p>
                ) : (
                  <div className="space-y-2">
                    {trending.map((item, i) => (
                      <button key={i} className="w-full text-left p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors">
                        <span className="text-gray-500 text-xs">#{i + 1}</span>
                        <p className="text-white text-sm">#{item.tag}</p>
                        <p className="text-gray-500 text-xs">{item.posts.toLocaleString()} posts</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-yellow-400 mb-4">📅 Upcoming</h3>
                {loadingSidebar ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event, i) => (
                      <div key={i} className="p-2 rounded-lg bg-blockchain-light/30">
                        <p className="text-white text-sm">{event.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-yellow-400 text-xs">🕐 {event.time}</span>
                          <button className="text-neon-cyan text-xs hover:underline">RSVP</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link 
                  href="/social/events"
                  className="block text-center text-yellow-400 text-sm mt-4 hover:underline"
                >
                  View all events →
                </Link>
              </div>

              {/* Suggested Creators - shows empty state until real API */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">✨ People to Follow</h3>
                <p className="text-gray-500 text-sm text-center py-4">
                  Suggestions coming soon
                </p>
                <Link 
                  href="/social/friends"
                  className="block text-center text-neon-cyan text-sm hover:underline"
                >
                  Find friends →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-[70vh]">
            <ChatLayout />
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && <Messages />}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && <MediaGallery />}

        {/* Services Tab */}
        {activeTab === 'services' && <ServiceMarketplace />}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="max-w-2xl mx-auto">
            <NotificationsPanel />
          </div>
        )}
      </div>
    </main>
  );
}
