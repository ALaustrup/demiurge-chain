'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { qorAuth } from '@demiurge/qor-sdk';
import { ReleaseType, getReleaseType, getReleaseCost, RELEASE_PRICING } from '@/lib/vyb/types';

interface TrackData {
  id: string;
  title: string;
  file: File | null;
  fileUrl: string;
  duration: number;
  isExplicit: boolean;
}

const GENRES = [
  'Electronic', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Metal', 'Jazz', 'Classical',
  'Country', 'Folk', 'Indie', 'Alternative', 'Ambient', 'Synthwave', 'Lo-Fi',
  'House', 'Techno', 'Drum & Bass', 'Dubstep', 'Reggae', 'World', 'Other'
];

export default function NewReleasePage() {
  const router = useRouter();
  const isAuthenticated = qorAuth.isAuthenticated();
  
  const [step, setStep] = useState<'info' | 'tracks' | 'preview' | 'minting'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isArtist, setIsArtist] = useState<boolean | null>(null);
  
  // Release info
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [isExplicit, setIsExplicit] = useState(false);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
  
  // Tracks
  const [tracks, setTracks] = useState<TrackData[]>([]);
  
  const releaseType = getReleaseType(tracks.length);
  const releaseCost = getReleaseCost(releaseType);

  useEffect(() => {
    checkArtistStatus();
  }, []);

  const checkArtistStatus = async () => {
    if (!isAuthenticated) {
      setIsArtist(false);
      return;
    }

    try {
      const response = await fetch('/api/music/artist', {
        headers: {
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsArtist(!!data.artist);
      } else {
        setIsArtist(false);
      }
    } catch {
      setIsArtist(false);
    }
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverArtPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTrack = () => {
    const newTrack: TrackData = {
      id: `track_${Date.now()}`,
      title: '',
      file: null,
      fileUrl: '',
      duration: 0,
      isExplicit: false,
    };
    setTracks([...tracks, newTrack]);
  };

  const updateTrack = (id: string, field: keyof TrackData, value: any) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const moveTrack = (id: string, direction: 'up' | 'down') => {
    const index = tracks.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    
    const newTracks = [...tracks];
    [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]];
    setTracks(newTracks);
  };

  const handleTrackFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Get audio duration
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        updateTrack(id, 'duration', Math.round(audio.duration));
        URL.revokeObjectURL(audio.src);
      };
      
      updateTrack(id, 'file', file);
      // Auto-fill title from filename if empty
      const track = tracks.find(t => t.id === id);
      if (track && !track.title) {
        const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        updateTrack(id, 'title', name);
      }
    }
  };

  const validateInfo = (): boolean => {
    if (!title.trim()) {
      setError('Release title is required');
      return false;
    }
    if (!genre) {
      setError('Please select a genre');
      return false;
    }
    if (!coverArt) {
      setError('Cover art is required');
      return false;
    }
    return true;
  };

  const validateTracks = (): boolean => {
    if (tracks.length === 0) {
      setError('Please add at least one track');
      return false;
    }
    
    for (const track of tracks) {
      if (!track.title.trim()) {
        setError('All tracks must have a title');
        return false;
      }
      if (!track.file && !track.fileUrl) {
        setError(`Track "${track.title}" needs an audio file or URL`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    
    if (step === 'info') {
      if (validateInfo()) setStep('tracks');
    } else if (step === 'tracks') {
      if (validateTracks()) setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'tracks') setStep('info');
    else if (step === 'preview') setStep('tracks');
  };

  const handleMintRelease = async () => {
    setStep('minting');
    setLoading(true);
    setError(null);

    try {
      const { releaseService } = await import('@/lib/music/release-service');
      
      const result = await releaseService.createRelease({
        title,
        genre,
        description,
        coverArtFile: coverArt || undefined,
        tracks: tracks.map(t => ({
          title: t.title,
          audioFile: t.file || undefined,
          duration: t.duration,
          isExplicit: t.isExplicit,
        })),
        isExplicit,
      });

      if (!result.success) {
        throw new Error(result.message || 'Mint failed');
      }

      router.push(`/music?release=success&nftId=${result.nftId || ''}`);
    } catch (err: any) {
      setError(err.message || 'Failed to mint release');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold text-white mb-4">Create a Release</h1>
          <p className="text-gray-400 mb-8">You need to be logged in to release music.</p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold rounded-lg"
          >
            Login with QOR ID
          </Link>
        </div>
      </main>
    );
  }

  // Not an artist
  if (isArtist === false) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🎤</div>
          <h1 className="text-3xl font-bold text-white mb-4">Become an Artist First</h1>
          <p className="text-gray-400 mb-8">
            You need to register as a Music Artist before you can release music.
          </p>
          <Link
            href="/music"
            className="inline-block px-8 py-3 bg-gradient-to-r from-neon-magenta to-neon-purple text-white font-bold rounded-lg"
          >
            Go to Music Page
          </Link>
        </div>
      </main>
    );
  }

  // Loading artist status
  if (isArtist === null) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/music" className="text-neon-cyan hover:underline text-sm mb-4 inline-block">
            ← Back to Music
          </Link>
          <h1 className="text-4xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
            Create New Release
          </h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-8">
          {['info', 'tracks', 'preview'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === s ? 'bg-neon-magenta text-black' :
                ['info', 'tracks', 'preview'].indexOf(step) > i ? 'bg-neon-cyan text-black' :
                'bg-gray-700 text-gray-400'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-16 h-1 ${
                ['info', 'tracks', 'preview'].indexOf(step) > i ? 'bg-neon-cyan' : 'bg-gray-700'
              }`} />}
            </div>
          ))}
        </div>

        {/* Pricing Info */}
        <div className="glass-panel p-4 rounded-lg mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Release Type:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              releaseType === 'single' ? 'bg-gray-600 text-white' :
              releaseType === 'ep' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-neon-cyan/20 text-neon-cyan'
            }`}>
              {releaseType.toUpperCase()} ({tracks.length} tracks)
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-400">Cost:</span>
            <span className="text-neon-magenta font-bold ml-2">{releaseCost} CGT</span>
          </div>
        </div>

        {/* Step 1: Release Info */}
        {step === 'info' && (
          <div className="glass-panel p-8 rounded-xl space-y-6">
            <h2 className="text-2xl font-grunge text-white">Release Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Art */}
              <div className="md:row-span-2">
                <label className="block text-sm text-gray-300 mb-2">Cover Art *</label>
                <div 
                  className="aspect-square bg-black/50 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-neon-magenta transition-colors overflow-hidden"
                  onClick={() => document.getElementById('cover-input')?.click()}
                >
                  {coverArtPreview ? (
                    <img src={coverArtPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">🖼️</div>
                      <p>Click to upload</p>
                      <p className="text-xs mt-1">1400x1400 recommended</p>
                    </div>
                  )}
                </div>
                <input
                  id="cover-input"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverArtChange}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Release Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Awesome Album"
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-neon-magenta focus:outline-none"
                  maxLength={100}
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Genre *</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white focus:border-neon-magenta focus:outline-none"
                >
                  <option value="">Select genre...</option>
                  {GENRES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell listeners about this release..."
                rows={3}
                className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-neon-magenta focus:outline-none resize-none"
                maxLength={1000}
              />
            </div>

            {/* Explicit */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="explicit"
                checked={isExplicit}
                onChange={(e) => setIsExplicit(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-black/50"
              />
              <label htmlFor="explicit" className="text-gray-300 cursor-pointer">
                Contains explicit content
              </label>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold rounded-lg hover:opacity-90"
              >
                Next: Add Tracks
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tracks */}
        {step === 'tracks' && (
          <div className="glass-panel p-8 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-grunge text-white">Tracks</h2>
              <button
                onClick={addTrack}
                className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
              >
                + Add Track
              </button>
            </div>

            {/* Track List */}
            <div className="space-y-4">
              {tracks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🎵</div>
                  <p>No tracks added yet</p>
                  <p className="text-sm">Click "Add Track" to get started</p>
                </div>
              ) : (
                tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className="glass-panel p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      {/* Track Number */}
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 font-bold">
                        {index + 1}
                      </div>
                      
                      {/* Track Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={track.title}
                          onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                          placeholder="Track title"
                          className="bg-black/50 border border-gray-700 rounded-lg p-2 text-white placeholder-gray-500 focus:border-neon-magenta focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleTrackFileChange(track.id, e)}
                            className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neon-magenta/20 file:text-neon-magenta hover:file:bg-neon-magenta/30"
                          />
                          {track.duration > 0 && (
                            <span className="text-gray-500 text-sm">
                              {formatDuration(track.duration)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveTrack(track.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveTrack(track.id, 'down')}
                          disabled={index === tracks.length - 1}
                          className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeTrack(track.id)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="bg-neon-magenta/10 border border-neon-magenta/30 rounded-lg p-4">
              <h4 className="text-neon-magenta font-semibold mb-2">Pricing Guide</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className={tracks.length >= 1 && tracks.length <= 3 ? 'text-white' : 'text-gray-500'}>
                  <div className="font-bold">Single</div>
                  <div>1-3 tracks = 20 CGT</div>
                </div>
                <div className={tracks.length >= 4 && tracks.length <= 7 ? 'text-white' : 'text-gray-500'}>
                  <div className="font-bold">EP</div>
                  <div>4-7 tracks = 50 CGT</div>
                </div>
                <div className={tracks.length >= 8 ? 'text-white' : 'text-gray-500'}>
                  <div className="font-bold">Album</div>
                  <div>8+ tracks = 75 CGT</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-8 py-3 glass-panel rounded-lg hover:bg-white/5"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={tracks.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Next: Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="glass-panel p-8 rounded-xl space-y-6">
            <h2 className="text-2xl font-grunge text-white">Preview & Mint</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Cover and Info */}
              <div className="space-y-4">
                {coverArtPreview && (
                  <img src={coverArtPreview} alt="Cover" className="w-full aspect-square rounded-xl object-cover" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="text-neon-magenta">{genre}</p>
                  <p className="text-sm text-gray-400 capitalize">{releaseType} • {tracks.length} tracks</p>
                </div>
              </div>

              {/* Track List */}
              <div className="md:col-span-2">
                <h4 className="font-bold text-white mb-4">Tracklist</h4>
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div key={track.id} className="flex items-center gap-4 p-3 glass-panel rounded-lg">
                      <span className="text-gray-500 w-6">{index + 1}</span>
                      <span className="flex-1 text-white">{track.title}</span>
                      <span className="text-gray-500">{formatDuration(track.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-6">
              <h4 className="text-neon-cyan font-semibold mb-4">Minting Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Release Type</span>
                  <span className="text-white capitalize">{releaseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tracks</span>
                  <span className="text-white">{tracks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Minting Fee</span>
                  <span className="text-neon-magenta font-bold">{releaseCost} CGT</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between text-lg">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-neon-magenta font-bold">{releaseCost} CGT</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-8 py-3 glass-panel rounded-lg hover:bg-white/5"
              >
                Back
              </button>
              <button
                onClick={handleMintRelease}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-neon-magenta to-neon-purple text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Mint Release ({releaseCost} CGT)
              </button>
            </div>
          </div>
        )}

        {/* Minting Step */}
        {step === 'minting' && (
          <div className="glass-panel p-8 rounded-xl text-center py-16">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neon-magenta via-neon-purple to-neon-cyan flex items-center justify-center animate-pulse mb-6">
              <span className="text-4xl">🎵</span>
            </div>
            <h2 className="text-2xl font-grunge text-neon-cyan mb-2">Minting Your Release...</h2>
            <p className="text-gray-400 mb-6">Uploading to IPFS and minting DRC-369 NFT</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-neon-magenta border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
