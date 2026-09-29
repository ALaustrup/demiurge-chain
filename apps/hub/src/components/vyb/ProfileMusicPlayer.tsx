'use client';

import { useState, useRef, useEffect } from 'react';
import type { ProfileTheme } from '@/lib/vyb/types';

interface ProfileMusicPlayerProps {
  theme: ProfileTheme;
  autoPlay?: boolean;
}

export function ProfileMusicPlayer({ theme, autoPlay = false }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const musicUrl = theme.musicFile || theme.profileSong;
  const playerStyle = theme.musicPlayerStyle || 'minimal';
  const accentColor = theme.musicPlayerColor || theme.primaryColor;

  if (!musicUrl || !theme.musicEnabled) return null;

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (!hasInteracted) setHasInteracted(true);
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Compact style - small floating button
  if (playerStyle === 'compact') {
    return (
      <>
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div className="flex justify-end px-4 py-1">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: `${accentColor}30`, border: `1px solid ${accentColor}60` }}
            title={isPlaying ? 'Pause' : 'Play profile music'}
          >
            <span className="text-xs" style={{ color: accentColor }}>
              {isPlaying ? '⏸' : '▶'}
            </span>
          </button>
        </div>
      </>
    );
  }

  // Full style - complete player
  if (playerStyle === 'full') {
    return (
      <>
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div 
          className="mx-4 mt-2 rounded-lg p-3"
          style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30` }}
        >
          {!hasInteracted && autoPlay && (
            <button
              onClick={togglePlay}
              className="w-full text-center py-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: accentColor }}
            >
              Click to play profile music ♪
            </button>
          )}
          {(hasInteracted || !autoPlay) && (
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                style={{ backgroundColor: `${accentColor}40`, border: `1px solid ${accentColor}` }}
              >
                <span style={{ color: accentColor }}>{isPlaying ? '⏸' : '▶'}</span>
              </button>
              <div className="flex-1 min-w-0">
                <div 
                  className="h-2 rounded-full cursor-pointer bg-gray-700 overflow-hidden"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: accentColor }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1 opacity-50" style={{ color: accentColor }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs opacity-50" style={{ color: accentColor }}>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  className="w-16 h-1 accent-current"
                  style={{ accentColor }}
                />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Minimal style (default) - thin bar below banner
  return (
    <>
      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div 
        className="flex items-center gap-2 px-4 py-1.5"
        style={{ backgroundColor: `${accentColor}08`, borderBottom: `1px solid ${accentColor}20` }}
      >
        {!hasInteracted && autoPlay ? (
          <button
            onClick={togglePlay}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
            style={{ color: accentColor }}
          >
            ♪ Click to play profile music
          </button>
        ) : (
          <>
            <button
              onClick={togglePlay}
              className="text-sm hover:scale-110 transition-transform"
              style={{ color: accentColor }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div 
              className="flex-1 h-1 rounded-full cursor-pointer bg-gray-800 overflow-hidden"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: accentColor }}
              />
            </div>
            <span className="text-xs opacity-40" style={{ color: accentColor }}>
              {formatTime(currentTime)}
            </span>
          </>
        )}
      </div>
    </>
  );
}
