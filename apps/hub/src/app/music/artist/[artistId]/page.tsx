'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMusic } from '@/contexts/MusicContext';
import { MusicArtistProfile, MusicRelease } from '@/lib/vyb/types';
import { ArtistBadgeNFT } from '@/components/music/ArtistBadge';
import { ReportArtistModal, VerificationInfo } from '@/components/music/ArtistVerification';

export default function ArtistProfilePage() {
  const params = useParams();
  const artistId = params.artistId as string;
  const { play } = useMusic();
  
  const [artist, setArtist] = useState<MusicArtistProfile | null>(null);
  const [releases, setReleases] = useState<MusicRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'releases' | 'about'>('releases');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (artistId) {
      fetchArtistData();
    }
  }, [artistId]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      
      // Fetch artist profile
      const artistResponse = await fetch(`/api/music/artist/${artistId}`);
      if (artistResponse.ok) {
        const data = await artistResponse.json();
        setArtist(data.artist);
      }

      // Fetch artist releases
      const releasesResponse = await fetch(`/api/music/releases?artistId=${artistId}`);
      if (releasesResponse.ok) {
        const data = await releasesResponse.json();
        setReleases(Array.isArray(data) ? data : data.releases || []);
      }
    } catch (error) {
      console.error('Failed to fetch artist data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-800 rounded-xl" />
            <div className="h-8 bg-gray-800 rounded w-1/3" />
            <div className="h-4 bg-gray-800 rounded w-2/3" />
          </div>
        </div>
      </main>
    );
  }

  if (!artist) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold text-white mb-4">Artist Not Found</h1>
          <p className="text-gray-400 mb-8">This artist profile doesn't exist or has been removed.</p>
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
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        {/* Cover Image */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-neon-magenta/30 via-neon-purple/20 to-neon-cyan/30"
          style={artist.coverImage ? {
            backgroundImage: `url(${artist.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Artist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto flex items-end gap-6">
            {/* Avatar */}
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-neon-magenta via-neon-purple to-neon-cyan p-1 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {artist.avatar ? (
                  <img src={artist.avatar} alt={artist.artistName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">🎤</span>
                )}
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {artist.isVerified ? (
                  <span className="bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <span>✓</span> Verified Artist
                  </span>
                ) : (
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                    Unverified
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-grunge text-white mb-2 truncate">
                {artist.artistName}
              </h1>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="text-neon-magenta">{artist.primaryGenre}</span>
                <span>•</span>
                <span>{artist.releaseCount} releases</span>
                <span>•</span>
                <span>{(artist.totalPlays || 0).toLocaleString()} plays</span>
                <span>•</span>
                <span>{(artist.followers || 0).toLocaleString()} followers</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              <button className="px-6 py-3 bg-neon-magenta text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                Follow
              </button>
              <button className="px-6 py-3 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                Share
              </button>
              <button 
                onClick={() => setShowReportModal(true)}
                className="px-4 py-3 glass-panel rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-gray-400"
                title="Report this artist"
              >
                ⚑
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab('releases')}
            className={`pb-4 px-2 font-semibold transition-colors ${
              activeTab === 'releases' 
                ? 'text-neon-cyan border-b-2 border-neon-cyan' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Releases
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-4 px-2 font-semibold transition-colors ${
              activeTab === 'about' 
                ? 'text-neon-cyan border-b-2 border-neon-cyan' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            About
          </button>
        </div>

        {/* Releases Tab */}
        {activeTab === 'releases' && (
          <div>
            {releases.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎵</div>
                <h3 className="text-xl font-bold text-white mb-2">No Releases Yet</h3>
                <p className="text-gray-400">This artist hasn't released any music yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {releases.map((release) => (
                  <Link
                    key={release.id}
                    href={`/music/release/${release.id}`}
                    className="group"
                  >
                    <div className="glass-panel rounded-xl overflow-hidden hover:border-neon-magenta/50 transition-colors">
                      {/* Cover Art */}
                      <div className="aspect-square bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 relative">
                        {release.coverArt ? (
                          <img 
                            src={release.coverArt} 
                            alt={release.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl">🎵</span>
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="w-14 h-14 rounded-full bg-neon-magenta flex items-center justify-center">
                            <span className="text-2xl ml-1">▶</span>
                          </button>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-white truncate">{release.title}</h4>
                        <p className="text-sm text-gray-400 capitalize">{release.releaseType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {release.tracks?.length || 0} tracks • {(release.totalPlays || 0).toLocaleString()} plays
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bio */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Bio</h3>
                <p className="text-gray-400 leading-relaxed">
                  {artist.bio || 'No bio available.'}
                </p>
              </div>

              {/* Genres */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-neon-magenta/20 text-neon-magenta rounded-full text-sm">
                    {artist.primaryGenre}
                  </span>
                  {artist.genres?.filter(g => g !== artist.primaryGenre).map((genre) => (
                    <span 
                      key={genre}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              {artist.socialLinks && Object.keys(artist.socialLinks).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Connect</h3>
                  <div className="flex flex-wrap gap-3">
                    {artist.socialLinks.soundcloud && (
                      <a 
                        href={artist.socialLinks.soundcloud}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
                      >
                        SoundCloud
                      </a>
                    )}
                    {artist.socialLinks.spotify && (
                      <a 
                        href={artist.socialLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                      >
                        Spotify
                      </a>
                    )}
                    {artist.socialLinks.appleMusic && (
                      <a 
                        href={artist.socialLinks.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 transition-colors"
                      >
                        Apple Music
                      </a>
                    )}
                    {artist.socialLinks.bandcamp && (
                      <a 
                        href={artist.socialLinks.bandcamp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                      >
                        Bandcamp
                      </a>
                    )}
                    {artist.socialLinks.twitter && (
                      <a 
                        href={artist.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        Twitter
                      </a>
                    )}
                    {artist.socialLinks.instagram && (
                      <a 
                        href={artist.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {artist.socialLinks.website && (
                      <a 
                        href={artist.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Artist Badge NFT */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Artist Badge</h3>
                <ArtistBadgeNFT
                  artistName={artist.artistName}
                  genre={artist.primaryGenre}
                  isVerified={artist.isVerified}
                  badgeId={artist.artistBadgeId}
                  releaseCount={artist.releaseCount}
                  totalPlays={artist.totalPlays}
                />
              </div>

              {/* Verification Info */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Verification Status</h3>
                <VerificationInfo isVerified={artist.isVerified} />
              </div>

              {/* Report */}
              {!artist.isVerified && (
                <div>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-2"
                  >
                    <span>⚑</span>
                    <span>Report this artist</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Modal */}
        {artist && (
          <ReportArtistModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            artistId={artist.id}
            artistName={artist.artistName}
          />
        )}
      </div>
    </main>
  );
}
