'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMusic, MusicTrack, Playlist } from '@/contexts/MusicContext';
import { qorAuth } from '@demiurge/qor-sdk';
import { ArtistOnboarding } from '@/components/music/ArtistOnboarding';
import { MusicRelease, MusicArtistProfile } from '@/lib/vyb/types';

const API_BASE = '/api';

const GENRES = [
  { name: 'Electronic', icon: '⚡', color: 'from-cyan-500 to-blue-500' },
  { name: 'Hip-Hop', icon: '🎤', color: 'from-orange-500 to-red-500' },
  { name: 'Ambient', icon: '🌌', color: 'from-purple-500 to-indigo-500' },
  { name: 'Synthwave', icon: '🌆', color: 'from-pink-500 to-purple-500' },
  { name: 'Lo-Fi', icon: '☕', color: 'from-amber-500 to-orange-500' },
  { name: 'Rock', icon: '🎸', color: 'from-red-500 to-rose-500' },
  { name: 'Jazz', icon: '🎷', color: 'from-yellow-500 to-amber-500' },
  { name: 'Classical', icon: '🎻', color: 'from-slate-400 to-slate-600' },
];

export default function MusicPage() {
  const { play, currentTrack, isPlaying, likeTrack, uploadTrack } = useMusic();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [releases, setReleases] = useState<MusicRelease[]>([]);
  const [featuredReleases, setFeaturedReleases] = useState<MusicRelease[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'releases' | 'radio' | 'playlists'>('discover');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  // Artist onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isArtist, setIsArtist] = useState<boolean | null>(null);

  const isAuthenticated = qorAuth.isAuthenticated();

  useEffect(() => {
    fetchAll();
    if (isAuthenticated) {
      checkArtistStatus();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'radio') {
      fetchTracks();
    }
  }, [selectedGenre, activeTab]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchReleases(),
      fetchFeatured(),
      fetchTracks(),
      fetchPlaylists(),
    ]);
    setLoading(false);
  };

  const fetchReleases = async () => {
    try {
      const response = await fetch(`${API_BASE}/music/releases`);
      if (response.ok) {
        const data = await response.json();
        setReleases(data.releases || []);
      }
    } catch (err) {
      console.error('Failed to fetch releases:', err);
    }
  };

  const fetchFeatured = async () => {
    try {
      const response = await fetch(`${API_BASE}/music/releases?featured=true&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setFeaturedReleases(data.releases || []);
      }
    } catch (err) {
      console.error('Failed to fetch featured:', err);
    }
  };

  const fetchTracks = async () => {
    try {
      const url = selectedGenre 
        ? `${API_BASE}/music?genre=${encodeURIComponent(selectedGenre)}`
        : `${API_BASE}/music`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTracks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
      setTracks([]);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`${API_BASE}/music/playlists`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  const checkArtistStatus = async () => {
    try {
      const response = await fetch('/api/music/artist', {
        headers: {
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsArtist(!!data.artist);
      }
    } catch {
      setIsArtist(false);
    }
  };

  const handleArtistSuccess = (artistId: string) => {
    setIsArtist(true);
    setShowOnboarding(false);
  };

  const handleLike = async (track: MusicTrack) => {
    if (!isAuthenticated) return;
    try {
      await likeTrack(track.id);
      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, likes: t.likes + 1 } : t
      ));
    } catch (err) {
      console.error('Failed to like track:', err);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-magenta/30 via-neon-purple/20 to-neon-cyan/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        
        {/* Floating music notes animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl opacity-20 animate-float"
              style={{
                left: `${10 + i * 12}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            >
              {['🎵', '🎶', '🎧', '🎸', '🎹', '🎷', '🎺', '🎻'][i]}
            </div>
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl md:text-7xl font-grunge mb-4">
            <span className="bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
              QOR MUSIC
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
            The first on-chain music platform. Release, collect, and stream music forever on the blockchain.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              isArtist ? (
                <Link
                  href="/music/release/new"
                  className="px-8 py-4 bg-gradient-to-r from-neon-magenta to-neon-purple text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-lg"
                >
                  Create Release
                </Link>
              ) : (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="px-8 py-4 bg-gradient-to-r from-neon-magenta to-neon-purple text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-lg"
                >
                  Submit Your Music
                </button>
              )
            ) : (
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-neon-magenta to-neon-purple text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-lg"
              >
                Sign In to Release Music
              </Link>
            )}
            <button
              onClick={() => setActiveTab('discover')}
              className="px-8 py-4 glass-panel rounded-xl hover:bg-white/10 transition-colors text-lg"
            >
              Explore Music
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-4">
            {[
              { id: 'discover', label: 'Discover', icon: '✨' },
              { id: 'releases', label: 'New Releases', icon: '🎵' },
              { id: 'radio', label: 'Radio', icon: '📻' },
              { id: 'playlists', label: 'Playlists', icon: '📀' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-magenta text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="space-y-12">
            {/* Featured Releases */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-grunge text-white">Featured Releases</h2>
                <Link href="/music?tab=releases" className="text-neon-cyan hover:underline">
                  View All →
                </Link>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-gray-800 rounded-xl mb-2" />
                      <div className="h-4 bg-gray-800 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : featuredReleases.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {featuredReleases.map((release) => (
                    <Link
                      key={release.id}
                      href={`/music/release/${release.id}`}
                      className="group"
                    >
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 overflow-hidden relative mb-2">
                        {release.coverArt ? (
                          <img src={release.coverArt} alt={release.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">🎵</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-neon-magenta flex items-center justify-center">
                            <span className="text-2xl ml-1">▶</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                        {release.title}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {release.artist?.artistName || 'Unknown Artist'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-xl">
                  <div className="text-5xl mb-4">🎵</div>
                  <p className="text-gray-400">No featured releases yet. Be the first!</p>
                </div>
              )}
            </section>

            {/* Browse by Genre */}
            <section>
              <h2 className="text-3xl font-grunge text-white mb-6">Browse by Genre</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {GENRES.map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => {
                      setSelectedGenre(genre.name);
                      setActiveTab('releases');
                    }}
                    className={`p-6 rounded-xl bg-gradient-to-br ${genre.color} relative overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    <div className="relative z-10">
                      <span className="text-4xl">{genre.icon}</span>
                      <h3 className="text-xl font-bold text-white mt-2">{genre.name}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Top Charts */}
            <section>
              <h2 className="text-3xl font-grunge text-white mb-6">Top Charts</h2>
              <div className="glass-panel rounded-xl p-6">
                {releases.length > 0 ? (
                  <div className="space-y-4">
                    {releases.slice(0, 10).map((release, index) => (
                      <Link
                        key={release.id}
                        href={`/music/release/${release.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <span className="text-2xl font-bold text-gray-600 w-8">{index + 1}</span>
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 overflow-hidden flex-shrink-0">
                          {release.coverArt ? (
                            <img src={release.coverArt} alt={release.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                            {release.title}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {release.artist?.artistName || 'Unknown Artist'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-400">{(release.totalPlays || 0).toLocaleString()} plays</div>
                          <div className="text-neon-magenta capitalize">{release.releaseType}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="text-gray-400">Charts will appear as releases are played</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Releases Tab */}
        {activeTab === 'releases' && (
          <div>
            {/* Genre filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  !selectedGenre ? 'bg-neon-cyan text-black' : 'glass-panel hover:bg-white/10'
                }`}
              >
                All Genres
              </button>
              {GENRES.map(genre => (
                <button
                  key={genre.name}
                  onClick={() => setSelectedGenre(selectedGenre === genre.name ? null : genre.name)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedGenre === genre.name ? 'bg-neon-cyan text-black' : 'glass-panel hover:bg-white/10'
                  }`}
                >
                  {genre.icon} {genre.name}
                </button>
              ))}
            </div>

            {/* Releases grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-800 rounded-xl mb-3" />
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : releases.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {releases
                  .filter(r => !selectedGenre || r.genre === selectedGenre)
                  .map((release) => (
                    <Link
                      key={release.id}
                      href={`/music/release/${release.id}`}
                      className="group"
                    >
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 overflow-hidden relative mb-3">
                        {release.coverArt ? (
                          <img src={release.coverArt} alt={release.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">🎵</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-neon-magenta flex items-center justify-center">
                            <span className="text-2xl ml-1">▶</span>
                          </div>
                        </div>
                        {release.isExplicit && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-gray-800/80 text-gray-300 text-xs rounded">E</span>
                        )}
                      </div>
                      <h3 className="font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                        {release.title}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">{release.artist?.artistName}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="capitalize">{release.releaseType}</span>
                        <span>•</span>
                        <span>{(release.totalPlays || 0).toLocaleString()} plays</span>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Releases Yet</h3>
                <p className="text-gray-400 mb-6">Be the first to release music on-chain!</p>
                {isAuthenticated && !isArtist && (
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="px-6 py-3 bg-gradient-to-r from-neon-magenta to-neon-purple text-white font-bold rounded-lg"
                  >
                    Become an Artist
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Radio Tab (Legacy Tracks) */}
        {activeTab === 'radio' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-grunge text-white mb-2">Community Radio</h2>
              <p className="text-gray-400">Free-form community uploads and mixes</p>
            </div>

            {/* Genre filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  !selectedGenre ? 'bg-neon-cyan text-black' : 'glass-panel hover:bg-white/10'
                }`}
              >
                All Genres
              </button>
              {GENRES.map(genre => (
                <button
                  key={genre.name}
                  onClick={() => setSelectedGenre(selectedGenre === genre.name ? null : genre.name)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedGenre === genre.name ? 'bg-neon-cyan text-black' : 'glass-panel hover:bg-white/10'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            {/* Tracks grid */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading tracks...</div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📻</div>
                <div className="text-xl text-gray-400">No tracks in the radio yet</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tracks.map(track => (
                  <div
                    key={track.id}
                    className={`glass-panel p-4 rounded-lg transition-all hover:scale-[1.02] ${
                      currentTrack?.id === track.id ? 'ring-2 ring-neon-cyan' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => play(track)}
                        className="w-14 h-14 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30 flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-neon-cyan animate-pulse" />
                            <div className="w-1 h-4 bg-neon-cyan animate-pulse" style={{ animationDelay: '75ms' }} />
                            <div className="w-1 h-4 bg-neon-cyan animate-pulse" style={{ animationDelay: '150ms' }} />
                          </div>
                        ) : (
                          <span className="text-neon-cyan text-2xl ml-1">▶</span>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">{track.title}</div>
                        <div className="text-sm text-gray-400 truncate">
                          {track.artist || 'Unknown Artist'}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>▶ {track.plays}</span>
                          <span>❤ {track.likes}</span>
                          {track.genre && (
                            <span className="px-2 py-0.5 bg-gray-700 rounded">{track.genre}</span>
                          )}
                        </div>
                      </div>

                      {isAuthenticated && (
                        <button
                          onClick={() => handleLike(track)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          ❤
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div>
            <h2 className="text-3xl font-grunge text-white mb-8">Curated Playlists</h2>
            
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    className="glass-panel p-6 rounded-xl hover:scale-[1.02] transition-transform cursor-pointer group"
                  >
                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center text-6xl mb-4 relative overflow-hidden">
                      {playlist.is_global ? '📻' : '🎶'}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-neon-cyan flex items-center justify-center">
                          <span className="text-2xl ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors">
                      {playlist.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {playlist.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{playlist.track_count} tracks</span>
                      {playlist.is_global && (
                        <span className="text-neon-cyan">Global Playlist</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📀</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Playlists Yet</h3>
                <p className="text-gray-400">Curated playlists will appear here soon</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artist Onboarding Modal */}
      <ArtistOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSuccess={handleArtistSuccess}
      />

      {/* Add padding at bottom for music player */}
      <div className="h-32" />

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </main>
  );
}
