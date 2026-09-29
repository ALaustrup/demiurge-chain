'use client';

import { useVYB } from '@/contexts/VYBContext';
import Link from 'next/link';

export function ProfileCard() {
  const { profile, isLoadingProfile } = useVYB();

  if (isLoadingProfile) {
    return (
      <div className="glass-panel p-6 rounded-xl animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-700 mx-auto mb-4" />
        <div className="h-4 bg-gray-700 rounded w-2/3 mx-auto mb-2" />
        <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!profile) return null;

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

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Cover Image */}
      <div 
        className="h-24 bg-gradient-to-r"
        style={{
          background: `linear-gradient(to right, ${profile.theme.primaryColor}, ${profile.theme.secondaryColor})`
        }}
      />

      {/* Profile Info */}
      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="relative -mt-10 mb-3">
          <div 
            className="w-20 h-20 rounded-full border-4 border-blockchain-dark bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-3xl mx-auto"
            style={{ borderColor: profile.theme.backgroundColor }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getRoleIcon(profile.role)
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-4">
          <h3 className="font-grunge-alt text-xl text-white flex items-center justify-center gap-2">
            {profile.displayName}
            {profile.isVerified && <span className="text-blue-400 text-sm">✓</span>}
          </h3>
          <p className="text-gray-500 text-sm">@{profile.qorId}</p>
          <p className="text-gray-400 text-xs mt-1 capitalize">{profile.role}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-400 text-sm text-center mb-4 line-clamp-2">
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="glass-panel p-2 rounded-lg">
            <p className="font-grunge text-neon-cyan">{profile.stats.followers}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="glass-panel p-2 rounded-lg">
            <p className="font-grunge text-neon-purple">{profile.stats.following}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
          <div className="glass-panel p-2 rounded-lg">
            <p className="font-grunge text-green-400">{profile.stats.cgtEarned}</p>
            <p className="text-xs text-gray-500">CGT</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">🎮 Games Played</span>
            <span className="text-white">{profile.stats.gamesPlayed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">🏆 Achievements</span>
            <span className="text-white">{profile.stats.achievementsUnlocked}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">🖼️ NFTs Owned</span>
            <span className="text-white">{profile.stats.nftsOwned}</span>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Badges</p>
            <div className="flex flex-wrap gap-1">
              {profile.badges.slice(0, 5).map((badge) => (
                <span 
                  key={badge.id} 
                  className="text-lg" 
                  title={badge.name}
                >
                  {badge.icon}
                </span>
              ))}
              {profile.badges.length > 5 && (
                <span className="text-xs text-gray-500">+{profile.badges.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            href="/social/profile"
            className="flex-1 glass-panel py-2 rounded-lg text-center text-sm hover:border-neon-cyan/50 transition-colors"
          >
            View Profile
          </Link>
          <Link 
            href="/settings"
            className="glass-panel py-2 px-3 rounded-lg text-sm hover:border-neon-cyan/50 transition-colors"
          >
            ⚙️
          </Link>
        </div>
      </div>
    </div>
  );
}
