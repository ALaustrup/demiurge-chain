'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMusic } from '@/contexts/MusicContext';
import { qorAuth } from '@demiurge/qor-sdk';
import { MusicRelease, MusicReleaseTrack } from '@/lib/vyb/types';

export default function ReleaseDetailPage() {
  const params = useParams();
  const releaseId = params.releaseId as string;
  const { play, currentTrack, isPlaying } = useMusic();
  
  const [release, setRelease] = useState<MusicRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = qorAuth.isAuthenticated();

  useEffect(() => {
    if (releaseId) {
      fetchRelease();
    }
  }, [releaseId]);

  const fetchRelease = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/music/release/${releaseId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Release not found');
        } else {
          setError('Failed to load release');
        }
        return;
      }

      const data = await response.json();
      setRelease(data.release || data);
    } catch (err) {
      console.error('Failed to fetch release:', err);
      setError('Failed to load release');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (): string => {
    if (!release?.tracks) return '0:00';
    const total = release.tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const mins = Math.floor(total / 60);
    const secs = Math.round(total % 60);
    return `${mins} min ${secs} sec`;
  };

  const handlePlayTrack = (track: MusicReleaseTrack) => {
    if (!track.audioUri) return;
    
    play({
      id: track.id,
      title: track.title,
      artist: release?.artist?.artistName || 'Unknown Artist',
      file_url: track.audioUri,
      plays: track.plays || 0,
      likes: 0,
      genre: release?.genre,
      uploader_id: release?.artistId || '',
      is_public: true,
      created_at: release?.createdAt?.toString() || new Date().toISOString(),
    });
  };

  const handlePlayAll = () => {
    if (release?.tracks?.[0]) {
      handlePlayTrack(release.tracks[0]);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex gap-8">
              <div className="w-64 h-64 bg-gray-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-gray-800 rounded w-2/3" />
                <div className="h-6 bg-gray-800 rounded w-1/3" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !release) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-5xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold text-white mb-4">{error || 'Release Not Found'}</h1>
          <p className="text-gray-400 mb-8">This release doesn't exist or has been removed.</p>
          <Link
            href="/music"
            className="inline-block px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold rounded-lg"
          >
            Browse Music
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <div className="relative">
        {/* Background gradient based on cover */}
        <div className="absolute inset-0 h-96 bg-gradient-to-b from-neon-magenta/20 via-neon-purple/10 to-transparent" />
        
        <div className="relative max-w-5xl mx-auto px-6 pt-8">
          <Link href="/music" className="text-neon-cyan hover:underline text-sm mb-6 inline-block">
            ← Back to Music
          </Link>

          <div className="flex flex-col md:flex-row gap-8 pb-8">
            {/* Cover Art */}
            <div className="w-64 h-64 flex-shrink-0 mx-auto md:mx-0">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-neon-magenta/30 to-neon-cyan/30 overflow-hidden shadow-2xl">
                {release.coverArt ? (
                  <img src={release.coverArt} alt={release.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">🎵</div>
                )}
              </div>
            </div>

            {/* Release Info */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="text-sm text-neon-magenta uppercase font-bold mb-2">
                {release.releaseType}
              </div>
              <h1 className="text-4xl md:text-5xl font-grunge text-white mb-3">
                {release.title}
              </h1>
              
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href={`/music/artist/${release.artistId}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-magenta to-neon-cyan flex items-center justify-center text-sm">
                    🎤
                  </div>
                  <span className="font-semibold text-white">
                    {release.artist?.artistName || 'Unknown Artist'}
                  </span>
                  {release.artist?.isVerified && (
                    <span className="text-neon-cyan text-sm">✓</span>
                  )}
                </Link>
              </div>

              <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
                <span>{release.genre}</span>
                <span>•</span>
                <span>{release.tracks?.length || 0} tracks</span>
                <span>•</span>
                <span>{getTotalDuration()}</span>
                <span>•</span>
                <span>{(release.totalPlays || 0).toLocaleString()} plays</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePlayAll}
                  className="px-8 py-3 bg-neon-magenta text-black font-bold rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <span>▶</span> Play
                </button>
                <button className="px-6 py-3 glass-panel rounded-full hover:bg-white/10 transition-colors">
                  ❤ {release.likes || 0}
                </button>
                <button className="px-6 py-3 glass-panel rounded-full hover:bg-white/10 transition-colors">
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Tracklist</h2>
          </div>
          
          <div className="divide-y divide-gray-800/50">
            {release.tracks?.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group ${
                  currentTrack?.id === track.id ? 'bg-neon-magenta/10' : ''
                }`}
                onClick={() => handlePlayTrack(track)}
              >
                {/* Track number / play indicator */}
                <div className="w-8 text-center">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex justify-center gap-0.5">
                      <div className="w-1 h-4 bg-neon-magenta animate-pulse" />
                      <div className="w-1 h-4 bg-neon-magenta animate-pulse" style={{ animationDelay: '75ms' }} />
                      <div className="w-1 h-4 bg-neon-magenta animate-pulse" style={{ animationDelay: '150ms' }} />
                    </div>
                  ) : (
                    <span className="text-gray-500 group-hover:hidden">{index + 1}</span>
                  )}
                  <span className="text-neon-magenta hidden group-hover:inline">▶</span>
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${
                    currentTrack?.id === track.id ? 'text-neon-magenta' : 'text-white'
                  }`}>
                    {track.title}
                    {track.isExplicit && (
                      <span className="ml-2 px-1 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">E</span>
                    )}
                  </div>
                </div>

                {/* Plays */}
                <div className="text-gray-500 text-sm">
                  {(track.plays || 0).toLocaleString()} plays
                </div>

                {/* Duration */}
                <div className="text-gray-500 text-sm w-12 text-right">
                  {formatDuration(track.duration || 0)}
                </div>
              </div>
            ))}

            {(!release.tracks || release.tracks.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No tracks available
              </div>
            )}
          </div>
        </div>

        {/* Release Info */}
        {release.description && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-3">About This Release</h3>
            <p className="text-gray-400 leading-relaxed">{release.description}</p>
          </div>
        )}

        {/* NFT Info */}
        <div className="mt-8 glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4">On-Chain Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-gray-500 text-sm">Release Type</div>
              <div className="text-white font-semibold capitalize">{release.releaseType}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Collectors</div>
              <div className="text-white font-semibold">{release.totalCollectors || 0}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Minted</div>
              <div className="text-white font-semibold">
                {release.mintedAt ? new Date(release.mintedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Mint Cost</div>
              <div className="text-neon-magenta font-semibold">{release.mintCost || 0} CGT</div>
            </div>
          </div>
          
          {release.nftId && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-gray-500 text-sm mb-1">NFT ID</div>
              <div className="text-xs text-gray-400 font-mono break-all">{release.nftId}</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding for player */}
      <div className="h-32" />
    </main>
  );
}
