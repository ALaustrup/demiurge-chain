'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { vybService } from '@/lib/vyb/service';

interface Friend {
  id: string;
  qorId: string;
  displayName: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface TopFriendsProps {
  friends?: Friend[];
  isOwnProfile?: boolean;
  maxDisplay?: number;
  onReorder?: (friendIds: string[]) => void;
}

export function TopFriends({ 
  friends: propsFriends, 
  isOwnProfile = false,
  maxDisplay = 8,
  onReorder 
}: TopFriendsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>(propsFriends || []);
  const [loading, setLoading] = useState(!propsFriends);

  useEffect(() => {
    if (!propsFriends) {
      loadTopFriends();
    }
  }, [propsFriends]);

  const loadTopFriends = async () => {
    setLoading(true);
    try {
      const topFriendsData = await vybService.getTopFriends(maxDisplay);
      if (topFriendsData && topFriendsData.length > 0) {
        setFriends(topFriendsData.map((f: any) => ({
          id: f.id,
          qorId: f.qorId || f.qor_id || '',
          displayName: f.displayName || f.name || 'Unknown',
          avatar: f.avatar,
          role: f.role || 'user',
          isOnline: f.isOnline || false,
          lastSeen: f.lastSeen ? new Date(f.lastSeen) : undefined,
        })));
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.warn('Could not load top friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const displayFriends = friends.slice(0, maxDisplay);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return '🎨';
      case 'musician': return '🎵';
      case 'developer': return '💻';
      case 'designer': return '✨';
      case 'gamer': return '🎮';
      case 'creator': return '🎬';
      case 'collector': return '💎';
      default: return '👤';
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    
    // Reorder logic would go here
    setDraggedId(null);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-grunge-alt text-lg text-neon-cyan flex items-center gap-2">
          ⭐ Top Friends
        </h3>
        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-500 hover:text-neon-cyan transition-colors text-sm"
          >
            {isEditing ? '✓ Done' : '✏️ Edit'}
          </button>
        )}
      </div>

      {/* Friends Grid */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, maxDisplay).map((i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 mx-auto mb-2 animate-pulse" />
                <div className="h-3 bg-white/5 rounded w-12 mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        ) : displayFriends.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-2">👥</p>
            <p className="text-gray-400 text-sm">No top friends selected yet</p>
            {isOwnProfile && (
              <Link href="/social/friends" className="mt-2 text-neon-cyan text-sm hover:underline block">
                + Add friends
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {displayFriends.map((friend, index) => (
              <Link
                key={friend.id}
                href={`/social/profile/${friend.qorId}`}
                draggable={isEditing}
                onDragStart={(e) => isEditing && handleDragStart(e, friend.id)}
                onDragOver={(e) => isEditing && handleDragOver(e)}
                onDrop={(e) => isEditing && handleDrop(e, friend.id)}
                className={`group text-center transition-all ${
                  isEditing 
                    ? 'cursor-move hover:scale-105 hover:bg-neon-cyan/10 rounded-lg p-2' 
                    : 'hover:scale-105'
                } ${draggedId === friend.id ? 'opacity-50' : ''}`}
              >
                {/* Avatar */}
                <div className="relative mx-auto mb-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xl border-2 border-transparent group-hover:border-neon-cyan/50 transition-colors">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getRoleIcon(friend.role)
                    )}
                  </div>
                  {/* Online Indicator */}
                  {friend.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-blockchain-dark" />
                  )}
                  {/* Rank Number */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-blockchain-dark rounded-full flex items-center justify-center text-xs text-gray-400 border border-gray-700">
                    {index + 1}
                  </div>
                </div>
                {/* Name */}
                <p className="text-white text-xs font-body truncate group-hover:text-neon-cyan transition-colors">
                  {friend.displayName}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 text-center">
        <Link 
          href="/social/friends" 
          className="text-gray-500 hover:text-neon-cyan transition-colors text-sm"
        >
          View all friends →
        </Link>
      </div>
    </div>
  );
}
