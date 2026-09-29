'use client';

import { useState, useEffect } from 'react';
import { useChatAPI } from './useChatAPI';
import type { MiniProfileData } from './types';

interface MiniProfileProps {
  qorId: string;
  position?: { x: number; y: number };
  onClose: () => void;
  onDM?: (qorId: string) => void;
}

export function MiniProfile({ qorId, position, onClose, onDM }: MiniProfileProps) {
  const { getProfile } = useChatAPI();
  const [profile, setProfile] = useState<MiniProfileData | null>(null);

  useEffect(() => {
    getProfile(qorId).then(setProfile);
  }, [qorId]);

  if (!profile) return null;

  const style = position ? {
    position: 'fixed' as const,
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.min(position.y, window.innerHeight - 220),
    zIndex: 100,
  } : {};

  return (
    <div
      style={style}
      className="w-64 glass-panel rounded-xl overflow-hidden shadow-xl border border-gray-700 animate-fade-in"
      onMouseLeave={onClose}
    >
      {/* Banner */}
      <div 
        className="h-16 relative"
        style={{
          background: profile.banner_url 
            ? `url(${profile.banner_url}) center/cover` 
            : 'linear-gradient(135deg, #00f5ff, #bf00ff)',
        }}
      />

      {/* Avatar + Info */}
      <div className="px-3 pb-3 -mt-6">
        <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-xl overflow-hidden mb-2">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            '👤'
          )}
        </div>
        <p className="text-white font-medium text-sm truncate">{profile.display_name}</p>
        <p className="text-gray-500 text-xs truncate">@{profile.qor_id}</p>
        
        {/* Details */}
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
          {profile.sex && <span>{profile.sex}</span>}
          {profile.age && <span>{profile.age}y</span>}
          {profile.location && <span>📍 {profile.location}</span>}
        </div>

        {profile.bio && (
          <p className="text-gray-400 text-xs mt-2 line-clamp-2">{profile.bio}</p>
        )}

        {/* Actions */}
        {onDM && (
          <button
            onClick={() => onDM(qorId)}
            className="mt-2 w-full text-xs py-1.5 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-colors"
          >
            💬 Message
          </button>
        )}
      </div>
    </div>
  );
}
