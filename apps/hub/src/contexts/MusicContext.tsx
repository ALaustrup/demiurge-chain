'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

// Types
export interface MusicTrack {
  id: string;
  uploader_id: string;
  uploader_qor_id?: string;
  title: string;
  artist?: string;
  file_url: string;
  duration_ms?: number;
  genre?: string;
  plays: number;
  likes: number;
  is_public: boolean;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  owner_qor_id?: string;
  is_global: boolean;
  is_public: boolean;
  cover_url?: string;
  track_count: number;
  created_at: string;
}

interface MusicContextValue {
  // State
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isMinimized: boolean;
  
  // Actions
  play: (track?: MusicTrack) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadPlaylist: (tracks: MusicTrack[]) => void;
  loadGlobalPlaylist: () => Promise<void>;
  toggleMinimized: () => void;
  uploadTrack: (data: { title: string; artist?: string; file_url: string; duration_ms?: number; genre?: string }) => Promise<MusicTrack>;
  likeTrack: (trackId: string) => Promise<void>;
}

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

// Use local API routes that proxy to qor-auth
const API_BASE = '/api';

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentIndexRef = useRef(0);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener('ended', () => {
        next();
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
      });
      
      return () => {
        audioRef.current?.pause();
        audioRef.current = null;
      };
    }
  }, []);

  // Load global playlist on mount
  useEffect(() => {
    loadGlobalPlaylist();
  }, []);

  const loadGlobalPlaylist = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/music/global`);
      if (response.ok) {
        const tracks = await response.json();
        setPlaylist(Array.isArray(tracks) ? tracks : []);
        if (tracks.length > 0 && !currentTrack) {
          setCurrentTrack(tracks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load global playlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylist = (tracks: MusicTrack[]) => {
    setPlaylist(tracks);
    currentIndexRef.current = 0;
    if (tracks.length > 0) {
      setCurrentTrack(tracks[0]);
    }
  };

  const play = async (track?: MusicTrack) => {
    if (!audioRef.current) return;
    
    if (track) {
      setCurrentTrack(track);
      audioRef.current.src = track.file_url;
      currentIndexRef.current = playlist.findIndex(t => t.id === track.id);
      
      // Record play (non-blocking)
      fetch(`${API_BASE}/music/tracks/${track.id}/play`, { method: 'POST' }).catch(() => {});
    }
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play:', err);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const next = () => {
    if (playlist.length === 0) return;
    
    currentIndexRef.current = (currentIndexRef.current + 1) % playlist.length;
    const nextTrack = playlist[currentIndexRef.current];
    play(nextTrack);
  };

  const previous = () => {
    if (playlist.length === 0) return;
    
    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      seek(0);
      return;
    }
    
    currentIndexRef.current = (currentIndexRef.current - 1 + playlist.length) % playlist.length;
    const prevTrack = playlist[currentIndexRef.current];
    play(prevTrack);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);
    if (audioRef.current) {
      audioRef.current.volume = clampedVol;
    }
  };

  const toggleMinimized = () => {
    setIsMinimized(prev => !prev);
  };

  const uploadTrack = async (data: { 
    title: string; 
    artist?: string; 
    file_url: string; 
    duration_ms?: number; 
    genre?: string 
  }): Promise<MusicTrack> => {
    const token = qorAuth.getToken();
    if (!token) {
      throw new Error('Must be logged in to upload tracks');
    }

    const response = await fetch(`${API_BASE}/music/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload track');
    }

    const track = await response.json();
    return track;
  };

  const likeTrack = async (trackId: string) => {
    const token = qorAuth.getToken();
    if (!token) {
      throw new Error('Must be logged in to like tracks');
    }

    await fetch(`${API_BASE}/music/tracks/${trackId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  return (
    <MusicContext.Provider value={{
      currentTrack,
      playlist,
      isPlaying,
      volume,
      currentTime,
      duration,
      isLoading,
      isMinimized,
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      loadPlaylist,
      loadGlobalPlaylist,
      toggleMinimized,
      uploadTrack,
      likeTrack,
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
