'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { vybService } from '@/lib/vyb/service';
import type { VYBProfile, FeedItem } from '@/lib/vyb/types';
import { FeedCard } from '@/components/vyb/FeedCard';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<VYBProfile | null>(null);
  const [userFeed, setUserFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');

  const qorId = decodeURIComponent(params.qorId as string);

  useEffect(() => {
    loadProfile();
  }, [qorId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await vybService.getProfile(qorId);
      setProfile(profileData);

      // Load user's posts
      const feed = await vybService.getFeed({ type: 'profile', userId: qorId, limit: 10 });
      setUserFeed(feed);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowing) {
      await vybService.unfollowUser(qorId);
    } else {
      await vybService.followUser(qorId);
    }
    setIsFollowing(!isFollowing);
  };

  const handleTip = async () => {
    const amount = parseFloat(tipAmount);
    if (amount > 0) {
      // TODO: Execute CGT transfer
      setShowTipModal(false);
      setTipAmount('');
    }
  };

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

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😢</p>
          <h1 className="text-2xl font-grunge text-white mb-2">User Not Found</h1>
          <p className="text-gray-400 mb-4">This profile doesn't exist or has been removed.</p>
          <Link href="/social" className="neon-button px-6 py-2 rounded-lg">
            Back to VYB
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Cover Image */}
      <div 
        className="h-48 md:h-64 relative"
        style={{
          background: `linear-gradient(135deg, ${profile.theme.primaryColor}, ${profile.theme.secondaryColor})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blockchain-dark/80 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div 
            className="w-32 h-32 rounded-full border-4 bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-5xl"
            style={{ borderColor: profile.theme.backgroundColor }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getRoleIcon(profile.role)
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-grunge text-white flex items-center gap-2">
              {profile.displayName}
              {profile.isVerified && <span className="text-blue-400">✓</span>}
            </h1>
            <p className="text-gray-500">@{profile.qorId}</p>
            <p className="text-gray-400 mt-2 max-w-lg">{profile.bio}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm" style={{ color: profile.theme.primaryColor }}>
                {getRoleIcon(profile.role)} <span className="capitalize">{profile.role}</span>
              </span>
              <span className="text-gray-500 text-sm">
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Actions */}
            {isAuthenticated && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    isFollowing 
                      ? 'glass-panel hover:border-red-500/50' 
                      : 'neon-button'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={() => setShowTipModal(true)}
                  className="glass-panel px-4 py-2 rounded-lg hover:border-green-500/50 transition-colors"
                >
                  💰 Tip CGT
                </button>
                <button className="glass-panel px-4 py-2 rounded-lg hover:border-neon-cyan/50 transition-colors">
                  💬 Message
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-grunge" style={{ color: profile.theme.primaryColor }}>
                {profile.stats.followers}
              </p>
              <p className="text-gray-500 text-sm">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-grunge" style={{ color: profile.theme.secondaryColor }}>
                {profile.stats.following}
              </p>
              <p className="text-gray-500 text-sm">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-grunge text-green-400">
                {profile.stats.cgtEarned}
              </p>
              <p className="text-gray-500 text-sm">CGT</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="mt-6 glass-panel p-4 rounded-xl">
            <h3 className="font-grunge-alt text-lg text-neon-cyan mb-3">🏆 Badges</h3>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="flex items-center gap-2 bg-blockchain-light/50 px-3 py-2 rounded-lg"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <p className="text-white text-sm">{badge.name}</p>
                    <p className="text-gray-500 text-xs capitalize">{badge.tier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-blue-400">{profile.stats.gamesPlayed}</p>
            <p className="text-gray-500 text-sm">Games Played</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-yellow-400">{profile.stats.achievementsUnlocked}</p>
            <p className="text-gray-500 text-sm">Achievements</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-purple-400">{profile.stats.nftsOwned}</p>
            <p className="text-gray-500 text-sm">NFTs Owned</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-pink-400">{profile.stats.nftsCreated}</p>
            <p className="text-gray-500 text-sm">NFTs Created</p>
          </div>
        </div>

        {/* User's Posts */}
        <div className="mt-8">
          <h2 className="font-grunge-alt text-2xl text-neon-cyan mb-4">
            📝 Posts
          </h2>
          {userFeed.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <p className="text-gray-400">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userFeed.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Back to VYB */}
        <div className="mt-8 text-center pb-8">
          <Link href="/social" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors">
            ← Back to VYB
          </Link>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel liquid-border p-6 rounded-xl w-80">
            <h3 className="font-grunge-alt text-neon-cyan text-xl mb-4">
              💰 Send CGT Tip
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tip <span className="text-neon-purple">{profile.displayName}</span>
            </p>
            <input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="Amount in CGT"
              min="0.01"
              step="0.01"
              className="w-full bg-blockchain-light/50 border border-neon-cyan/30 rounded-lg px-4 py-2 text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="flex-1 neon-button py-2 rounded-lg disabled:opacity-50"
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
