'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { ipfsToHttp } from '@/lib/ipfs-client';

interface MediaViewerProps {
  uri: string;
  type: string;
  mimeType?: string;
  name?: string;
  fullscreen?: boolean;
}

function ImageViewer({ url, name }: { url: string; name?: string }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={(e) => {
        e.preventDefault();
        setZoom(prev => Math.max(0.5, Math.min(5, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
      }}
      onMouseDown={(e) => {
        setIsDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseMove={(e) => {
        if (!isDragging) return;
        setPosition(prev => ({
          x: prev.x + (e.clientX - lastPos.current.x),
          y: prev.y + (e.clientY - lastPos.current.y),
        }));
        lastPos.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <img
        src={url}
        alt={name || 'NFT Media'}
        className="w-full h-full object-contain transition-transform"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
        }}
        draggable={false}
      />
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex gap-1">
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
          className="w-8 h-8 bg-black/70 border border-ink-dim/30 text-white text-sm hover:border-cyber/50 transition-colors"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
          className="px-2 h-8 bg-black/70 border border-ink-dim/30 text-white text-[10px] font-mono hover:border-cyber/50 transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom(prev => Math.min(5, prev + 0.25))}
          className="w-8 h-8 bg-black/70 border border-ink-dim/30 text-white text-sm hover:border-cyber/50 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function AudioViewer({ url, name }: { url: string; name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Waveform Placeholder */}
        <div className="h-24 bg-architect-surface border border-ink-dim/20 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute text-4xl animate-breathing">🎵</div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isPlaying) {
                  audioRef.current?.pause();
                } else {
                  audioRef.current?.play();
                }
                setIsPlaying(!isPlaying);
              }}
              className="w-12 h-12 flex items-center justify-center bg-cyber/10 border border-cyber/50 text-cyber hover:bg-cyber/20 transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration || 1}
                value={currentTime}
                onChange={(e) => {
                  const time = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = time;
                  setCurrentTime(time);
                }}
                className="w-full accent-cyber"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-mono text-ink-dim">{formatTime(currentTime)}</span>
                <span className="text-[10px] font-mono text-ink-dim">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
          {name && (
            <p className="text-sm text-ink-body font-body text-center">{name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoViewer({ url, name }: { url: string; name?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        src={url}
        controls
        className="max-w-full max-h-full"
        playsInline
      >
        <track kind="captions" />
      </video>
    </div>
  );
}

function Model3DViewer({ url, name }: { url: string; name?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <div className="w-24 h-24 mx-auto bg-cyber/10 border border-cyber/30 flex items-center justify-center">
          <span className="text-4xl">🧊</span>
        </div>
        <div>
          <p className="text-sm text-white font-display tracking-wider">3D MODEL VIEWER</p>
          <p className="text-xs text-ink-muted font-body mt-1">
            {name || 'model'}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-4 py-2 bg-cyber/10 border border-cyber/50 text-cyber text-xs font-display tracking-wider hover:bg-cyber/20 transition-colors"
          >
            DOWNLOAD MODEL
          </a>
        </div>
      </div>
    </div>
  );
}

function FallbackViewer({ url, type, name }: { url: string; type: string; name?: string }) {
  const typeIcons: Record<string, string> = {
    ue5_asset: '🎮',
    animation: '✨',
    document: '📄',
    custom: '📦',
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <div className="w-24 h-24 mx-auto bg-steel/10 border border-steel-light/30 flex items-center justify-center">
          <span className="text-4xl">{typeIcons[type] || '📦'}</span>
        </div>
        <div>
          <p className="text-sm text-white font-display tracking-wider">{type.toUpperCase().replace('_', ' ')}</p>
          {name && <p className="text-xs text-ink-muted font-body mt-1">{name}</p>}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-4 py-2 bg-steel/10 border border-steel-light/50 text-steel-light text-xs font-display tracking-wider hover:bg-steel/20 transition-colors"
          >
            DOWNLOAD
          </a>
        </div>
      </div>
    </div>
  );
}

export function MediaViewer({ uri, type, mimeType, name, fullscreen }: MediaViewerProps) {
  const url = ipfsToHttp(uri);

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-black'
    : 'w-full h-full min-h-[400px]';

  return (
    <div className={containerClass}>
      {type === 'image' && <ImageViewer url={url} name={name} />}
      {type === 'audio' && <AudioViewer url={url} name={name} />}
      {type === 'video' && <VideoViewer url={url} name={name} />}
      {type === 'model_3d' && <Model3DViewer url={url} name={name} />}
      {!['image', 'audio', 'video', 'model_3d'].includes(type) && (
        <FallbackViewer url={url} type={type} name={name} />
      )}
    </div>
  );
}
