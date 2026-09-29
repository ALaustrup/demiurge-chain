'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { vybService } from '@/lib/vyb/service';

type TabType = 'upcoming' | 'attending' | 'past';

interface Event {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverGradient: [string, string];
  type: 'tournament' | 'drop' | 'ama' | 'meetup' | 'stream' | 'launch';
  date: Date;
  location: string;
  isVirtual: boolean;
  attendeeCount: number;
  maxAttendees?: number;
  isAttending: boolean;
  hostName: string;
  hostAvatar?: string;
  groupName?: string;
}

export default function EventsPage() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const now = new Date();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const [upcomingData, pastData] = await Promise.all([
        vybService.getEvents('upcoming'),
        vybService.getEvents('past'),
      ]);
      
      setEvents(upcomingData.map(formatEvent));
      setPastEvents(pastData.map(formatEvent));
    } catch (error) {
      console.warn('Could not load events:', error);
      setEvents([]);
      setPastEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const formatEvent = (e: any): Event => ({
    id: e.id,
    title: e.title,
    description: e.description,
    icon: getEventIcon(e.type),
    coverGradient: getEventGradient(e.type),
    type: e.type,
    date: new Date(e.date),
    location: e.location,
    isVirtual: e.isVirtual ?? true,
    attendeeCount: e.attendeeCount || 0,
    maxAttendees: e.maxAttendees,
    isAttending: e.isAttending || false,
    hostName: e.hostName || 'Unknown',
    hostAvatar: e.hostAvatar,
    groupName: e.groupName,
  });

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'tournament': return '🏆';
      case 'drop': return '💎';
      case 'ama': return '💬';
      case 'meetup': return '🎉';
      case 'stream': return '🎨';
      case 'launch': return '🚀';
      default: return '📅';
    }
  };

  const getEventGradient = (type: string): [string, string] => {
    switch (type) {
      case 'tournament': return ['#ffd700', '#ff8c00'];
      case 'drop': return ['#bf00ff', '#00f5ff'];
      case 'ama': return ['#00ff41', '#008f11'];
      case 'meetup': return ['#0096c7', '#90e0ef'];
      case 'stream': return ['#ff6b35', '#f7c59f'];
      case 'launch': return ['#7b2cbf', '#c77dff'];
      default: return ['#6b7280', '#9ca3af'];
    }
  };

  const getTypeLabel = (type: Event['type']) => {
    switch (type) {
      case 'tournament': return { label: 'Tournament', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
      case 'drop': return { label: 'NFT Drop', color: 'text-purple-400', bg: 'bg-purple-500/10' };
      case 'ama': return { label: 'AMA', color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'meetup': return { label: 'Meetup', color: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'stream': return { label: 'Live Stream', color: 'text-red-400', bg: 'bg-red-500/10' };
      case 'launch': return { label: 'Launch', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' };
      default: return { label: 'Event', color: 'text-gray-400', bg: 'bg-gray-500/10' };
    }
  };

  const formatDate = (date: Date) => {
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    
    if (diff < 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (days === 0) {
      if (hours === 0) return 'Starting soon';
      return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const attendingEvents = events.filter(e => e.isAttending);
  const currentList = activeTab === 'upcoming' ? events 
    : activeTab === 'attending' ? attendingEvents
    : pastEvents;

  if (loading || loadingEvents) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

  const tabs = [
    { id: 'upcoming' as TabType, label: 'Upcoming', icon: '📅', count: events.length },
    { id: 'attending' as TabType, label: 'Attending', icon: '✓', count: attendingEvents.length },
    { id: 'past' as TabType, label: 'Past', icon: '📜', count: pastEvents.length },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/social" className="text-gray-500 hover:text-neon-cyan transition-colors text-sm mb-2 inline-block">
                ← Back to VYB
              </Link>
              <h1 className="text-3xl font-grunge bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                📅 Events
              </h1>
              <p className="text-gray-400 text-sm mt-1">Tournaments, drops, AMAs, and more</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="neon-button px-4 py-2 rounded-lg"
            >
              + Create Event
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-400'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blockchain-dark text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {currentList.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-gray-400">
              {activeTab === 'attending' 
                ? "You're not attending any events yet"
                : activeTab === 'past'
                ? 'No past events'
                : 'No upcoming events'}
            </p>
            {activeTab !== 'past' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-neon-cyan hover:underline"
              >
                Create an event →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {currentList.map((event) => {
              const typeInfo = getTypeLabel(event.type);
              const isPast = event.date.getTime() < now.getTime();
              
              return (
                <div
                  key={event.id}
                  className={`glass-panel rounded-xl overflow-hidden hover:border-yellow-400/30 transition-all ${
                    isPast ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Cover */}
                    <div 
                      className="w-full md:w-64 h-32 md:h-auto flex-shrink-0 relative"
                      style={{
                        background: `linear-gradient(135deg, ${event.coverGradient[0]}, ${event.coverGradient[1]})`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-5xl">
                        {event.icon}
                      </div>
                      {/* Type Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-grunge-alt text-xl text-white">{event.title}</h3>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                        </div>
                        {/* Date */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-grunge text-lg ${isPast ? 'text-gray-500' : 'text-yellow-400'}`}>
                            {formatDate(event.date)}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatFullDate(event.date)}
                          </p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                        <span className="text-gray-400">
                          📍 {event.location}
                        </span>
                        <span className="text-gray-400">
                          👥 {event.attendeeCount} attending
                          {event.maxAttendees && ` / ${event.maxAttendees} max`}
                        </span>
                        {event.groupName && (
                          <Link 
                            href={`/social/groups/${event.id}`}
                            className="text-neon-purple hover:underline"
                          >
                            🏛️ {event.groupName}
                          </Link>
                        )}
                      </div>

                      {/* Host & Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-sm">
                            👤
                          </div>
                          <span className="text-gray-400 text-sm">
                            Hosted by <span className="text-white">{event.hostName}</span>
                          </span>
                        </div>

                        {!isPast && (
                          <div className="flex items-center gap-2">
                            {event.isAttending ? (
                              <>
                                <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm border border-green-500/30">
                                  ✓ Attending
                                </span>
                                <button className="glass-panel px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                                  Add to Calendar
                                </button>
                              </>
                            ) : (
                              <button className="neon-button px-6 py-2 rounded-lg text-sm">
                                RSVP
                              </button>
                            )}
                            <button className="glass-panel px-3 py-2 rounded-lg text-gray-400 hover:text-neon-cyan transition-colors">
                              📤
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pt-20"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-lg rounded-xl overflow-hidden max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <h2 className="font-grunge text-xl text-yellow-400">📅 Create Event</h2>
              <p className="text-gray-400 text-xs mt-1">Host a tournament, drop, or meetup</p>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Event Title</label>
                <input
                  type="text"
                  placeholder="My Awesome Event"
                  className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-yellow-400/50 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea
                  placeholder="What's this event about?"
                  rows={2}
                  className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-yellow-400/50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Time</label>
                  <input
                    type="time"
                    className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Event Type</label>
                <select className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-yellow-400/50 focus:outline-none">
                  <option value="tournament">🏆 Tournament</option>
                  <option value="drop">💎 NFT Drop</option>
                  <option value="ama">💬 AMA</option>
                  <option value="meetup">👋 Meetup</option>
                  <option value="stream">📺 Live Stream</option>
                  <option value="launch">🚀 Launch</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button className="flex-1 neon-button py-2 rounded-lg text-sm">
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
