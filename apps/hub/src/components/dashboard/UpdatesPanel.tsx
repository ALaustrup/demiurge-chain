'use client';

import { useState, useEffect } from 'react';

interface Update {
  id: string;
  type: 'announcement' | 'maintenance' | 'feature' | 'event';
  title: string;
  content: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

// Updates fetched from on-chain announcements or API
const INITIAL_UPDATES: Update[] = [];

export function UpdatesPanel() {
  const [updates, setUpdates] = useState<Update[]>(INITIAL_UPDATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        // Fetch from announcements API or on-chain when available
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data = await response.json();
          setUpdates(data.updates || []);
        }
      } catch {
        // API not available - show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  const getTypeIcon = (type: Update['type']) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'maintenance': return '🔧';
      case 'feature': return '✨';
      case 'event': return '🎉';
      default: return '📌';
    }
  };

  const getTypeColor = (type: Update['type']) => {
    switch (type) {
      case 'announcement': return 'text-neon-cyan';
      case 'maintenance': return 'text-yellow-400';
      case 'feature': return 'text-neon-magenta';
      case 'event': return 'text-neon-green';
      default: return 'text-gray-400';
    }
  };

  const getPriorityStyle = (priority: Update['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-neon-cyan';
      case 'medium': return 'border-l-neon-magenta/50';
      case 'low': return 'border-l-dark-600';
      default: return 'border-l-dark-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Updates</h3>
        <span className="text-xs text-gray-400">On-Chain Announcements</span>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-gray-500 text-sm">Loading updates...</div>
        ) : updates.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            <p>No announcements yet.</p>
            <p className="text-xs mt-1">Check back later for updates.</p>
          </div>
        ) : null}
        {updates.map((update) => (
          <div 
            key={update.id}
            className={`glass-panel p-3 rounded-lg border-l-4 ${getPriorityStyle(update.priority)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getTypeIcon(update.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${getTypeColor(update.type)}`}>
                    {update.title}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {update.content}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {formatTime(update.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 glass-panel py-2 rounded text-sm text-gray-400 hover:text-white transition-colors">
        View All Updates
      </button>
    </div>
  );
}
