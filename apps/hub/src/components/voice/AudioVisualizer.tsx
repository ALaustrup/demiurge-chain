'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  mode?: 'bars' | 'waveform' | 'circle';
  color?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * AudioVisualizer Component
 * 
 * Displays real-time audio visualization using the Web Audio API.
 * Supports multiple visualization modes: bars, waveform, and circle.
 */
export function AudioVisualizer({
  isActive,
  mode = 'bars',
  color = '#00FFFF',
  secondaryColor = '#FF00FF',
  size = 'md',
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Size configurations
  const sizes = {
    sm: { width: 100, height: 40, barWidth: 2, gap: 1 },
    md: { width: 200, height: 60, barWidth: 3, gap: 2 },
    lg: { width: 300, height: 80, barWidth: 4, gap: 2 },
  };

  const { width, height, barWidth, gap } = sizes[size];

  // Initialize audio capture
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsInitialized(true);
    } catch (error) {
      console.error('[AudioVisualizer] Failed to initialize:', error);
    }
  }, [isInitialized]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsInitialized(false);
  }, []);

  // Draw bars visualization
  const drawBars = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, width, height);

    const barCount = Math.floor(width / (barWidth + gap));
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * height;

      // Gradient from primary to secondary color based on height
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, secondaryColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * (barWidth + gap),
        height - barHeight,
        barWidth,
        barHeight
      );
    }
  }, [width, height, barWidth, gap, color, secondaryColor]);

  // Draw waveform visualization
  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [width, height, color]);

  // Draw circle visualization
  const drawCircle = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number) => {
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 4;

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const scale = average / 128;

    // Draw pulsing circle
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseRadius * (1 + scale * 0.5)
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, secondaryColor);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * (1 + scale * 0.5), 0, Math.PI * 2);
    ctx.fill();

    // Draw inner circle
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, [width, height, color, secondaryColor]);

  // Animation loop
  const animate = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      switch (mode) {
        case 'waveform':
          analyser.getByteTimeDomainData(dataArray);
          drawWaveform(ctx, dataArray, bufferLength);
          break;
        case 'circle':
          drawCircle(ctx, dataArray, bufferLength);
          break;
        case 'bars':
        default:
          drawBars(ctx, dataArray, bufferLength);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, [isActive, mode, width, height, drawBars, drawWaveform, drawCircle]);

  // Handle activation/deactivation
  useEffect(() => {
    if (isActive) {
      initializeAudio().then(() => {
        animate();
      });
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Clear canvas when inactive
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
        }
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, initializeAudio, animate, width, height]);

  // Full cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${className}`}
      style={{ display: 'block' }}
    />
  );
}

/**
 * Simplified audio level indicator (no canvas, just bars)
 */
interface AudioLevelIndicatorProps {
  level: number; // 0-1
  barCount?: number;
  color?: string;
  className?: string;
}

export function AudioLevelIndicator({
  level,
  barCount = 5,
  color = '#00FFFF',
  className = '',
}: AudioLevelIndicatorProps) {
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const threshold = (i + 1) / barCount;
        const isActive = level >= threshold * 0.8;
        const baseHeight = 4 + (i * 2);
        
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-100"
            style={{
              width: '3px',
              height: `${baseHeight}px`,
              backgroundColor: isActive ? color : 'rgba(255,255,255,0.2)',
              opacity: isActive ? 1 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Speaking indicator (animated dots)
 */
export function SpeakingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce"
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
    </div>
  );
}
