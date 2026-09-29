'use client';

import { useState, useEffect, useRef } from 'react';
import { qorAuth, type User } from '@demiurge/qor-sdk';

interface QorIdAvatarProps {
  user: User;
}

export function QorIdAvatar({ user }: QorIdAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const avatarRef = useRef<HTMLDivElement>(null);
  
  // Check if user has uploaded avatar
  const hasUploadedAvatar = user.avatar_url && user.avatar_url.trim() !== '';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        setMousePosition({
          x: (e.clientX - centerX) / rect.width,
          y: (e.clientY - centerY) / rect.height,
        });
      }
    };

    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isHovered]);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 500);
  };

  // Generate random colors for the avatar based on QOR ID
  const generateColors = (qorId: string) => {
    // Use a default hash if qorId is empty/undefined
    const id = qorId || 'default-avatar';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue1 = (hash % 360);
    const hue2 = ((hash * 7) % 360);
    
    return {
      primary: `hsl(${hue1}, 70%, 60%)`,
      secondary: `hsl(${hue2}, 70%, 50%)`,
    };
  };

  const colors = generateColors(user.qor_id || '');

  // If user has uploaded avatar, show the image
  if (hasUploadedAvatar) {
    return (
      <div
        ref={avatarRef}
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div
          className="relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300"
          style={{
            borderColor: isHovered ? 'rgba(0,242,255,0.8)' : 'rgba(0,242,255,0.4)',
            transform: isHovered
              ? `scale(${isClicked ? 1.2 : 1.1})`
              : 'scale(1)',
            filter: isHovered ? 'drop-shadow(0 0 20px rgba(0,242,255,0.6))' : 'drop-shadow(0 0 10px rgba(0,242,255,0.3))',
          }}
        >
          <img
            src={user.avatar_url!}
            alt={`${user.qor_id} avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to generated avatar if image fails to load
              console.warn('Avatar image failed to load, falling back to generated avatar');
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Glow overlay on hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-demiurge-cyan/20 animate-pulse" />
          )}
        </div>

        {/* Click Animation Overlay */}
        {isClicked && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(0,242,255,0.4), transparent)`,
              animation: 'pulse 0.5s ease-out',
            }}
          />
        )}
      </div>
    );
  }

  // Default: Generated 3D Lion-Headed Serpent Avatar
  return (
    <div
      ref={avatarRef}
      className="relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 3D Lion-Headed Serpent Avatar */}
      <div
        className="relative w-12 h-12 transition-all duration-300"
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateY(${mousePosition.x * 20}deg) rotateX(${-mousePosition.y * 20}deg) scale(${isClicked ? 1.2 : 1.1})`
            : 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)',
          filter: isHovered ? 'drop-shadow(0 0 20px rgba(0,242,255,0.6))' : 'drop-shadow(0 0 10px rgba(0,242,255,0.3))',
        }}
      >
        {/* Serpent Body (Base) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            transform: 'rotate(45deg)',
          }}
        />
        
        {/* Lion Head (Top) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
            border: '2px solid rgba(0,242,255,0.5)',
            boxShadow: '0 0 20px rgba(0,242,255,0.4)',
            transform: isHovered
              ? `translateY(${-mousePosition.y * 5}px) translateX(${mousePosition.x * 3}px)`
              : 'translateY(0px)',
          }}
        >
          {/* Lion Mane */}
          <div
            className="absolute -inset-2 rounded-full opacity-60"
            style={{
              background: `radial-gradient(circle, ${colors.primary}, transparent)`,
            }}
          />
          
          {/* Eyes */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-demiurge-cyan rounded-full animate-glow-pulse" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-demiurge-cyan rounded-full animate-glow-pulse" />
        </div>

        {/* Serpent Tail (Bottom) */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            transform: isHovered
              ? `translateY(${mousePosition.y * 3}px) rotate(${mousePosition.x * 10}deg)`
              : 'translateY(0px) rotate(0deg)',
          }}
        />
      </div>

      {/* Click Animation Overlay */}
      {isClicked && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.primary}, transparent)`,
            animation: 'pulse 0.5s ease-out',
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}
