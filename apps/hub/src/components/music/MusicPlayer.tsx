'use client';

import { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicPlayer() {
  const {
    currentTrack,
    playlist,
    isPlaying,
    volume,
    currentTime,
    duration,
    isMinimized,
    isLoading,
    play,
    pause,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMinimized,
  } = useMusic();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Don't render if no playlist loaded
  if (playlist.length === 0 && !isLoading) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Minimized player (compact bar)
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-t border-demiurge-cyan/20 h-14 flex items-center px-4 gap-4">
        {/* Expand button */}
        <button
          onClick={toggleMinimized}
          className="text-gray-400 hover:text-demiurge-cyan transition-colors"
          title="Expand player"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          {currentTrack ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-demiurge-cyan/30 to-demiurge-violet/30 flex items-center justify-center text-lg">
                🎵
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{currentTrack.title}</div>
                <div className="text-xs text-gray-400 truncate">{currentTrack.artist || 'Unknown Artist'}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Demiurge Radio</div>
          )}
        </div>

        {/* Progress bar (mini) */}
        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
          <span className="text-xs text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={previous}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button
            onClick={toggle}
            className="p-2 w-10 h-10 rounded-full bg-demiurge-cyan text-black hover:bg-demiurge-cyan/80 transition-all"
          >
            {isPlaying ? (
              <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 mx-auto ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={next}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 relative">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {volume === 0 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          
          {showVolumeSlider && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-gray-800 rounded-lg shadow-xl">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 accent-demiurge-cyan"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded player
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-900/98 to-gray-800/98 backdrop-blur-xl border-t border-demiurge-cyan/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2 text-sm text-demiurge-cyan font-bold">
          <span className="animate-pulse">🎧</span>
          <span>DEMIURGE RADIO</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              showPlaylist ? 'bg-demiurge-cyan text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Playlist ({playlist.length})
          </button>
          <button
            onClick={toggleMinimized}
            className="text-gray-400 hover:text-demiurge-cyan transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Playlist panel */}
      {showPlaylist && (
        <div className="max-h-48 overflow-y-auto px-4 py-2 bg-black/30">
          {playlist.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => play(track)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${
                currentTrack?.id === track.id 
                  ? 'bg-demiurge-cyan/20 text-demiurge-cyan' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <span className="text-xs text-gray-500 w-6">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{track.title}</div>
                <div className="text-xs text-gray-500 truncate">{track.artist || 'Unknown'}</div>
              </div>
              {currentTrack?.id === track.id && isPlaying && (
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-demiurge-cyan animate-pulse" />
                  <div className="w-1 h-3 bg-demiurge-cyan animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-demiurge-cyan animate-pulse delay-150" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main player */}
      <div className="p-4 flex items-center gap-4">
        {/* Track artwork */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-demiurge-cyan/30 to-demiurge-violet/30 flex items-center justify-center text-3xl flex-shrink-0">
          🎵
        </div>

        {/* Track info and controls */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <div className="text-lg font-bold text-white truncate">
              {currentTrack?.title || 'No track selected'}
            </div>
            <div className="text-sm text-gray-400 truncate">
              {currentTrack?.artist || 'Select a track to play'}
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12 text-right">{formatTime(currentTime)}</span>
            <div 
              className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seek(pos * duration);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-xs text-gray-500 w-12">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={previous}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button
            onClick={toggle}
            className="p-3 w-14 h-14 rounded-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black hover:opacity-80 transition-all shadow-lg shadow-demiurge-cyan/30"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 mx-auto ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={next}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Volume slider */}
        <div className="hidden lg:flex items-center gap-2 w-32">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-demiurge-cyan h-1"
          />
        </div>
      </div>
    </div>
  );
}
