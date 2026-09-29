'use client';

interface ArtistBadgeProps {
  artistName: string;
  isVerified?: boolean;
  genre?: string;
  size?: 'sm' | 'md' | 'lg';
  showGenre?: boolean;
}

export function ArtistBadge({ 
  artistName, 
  isVerified = false, 
  genre,
  size = 'md',
  showGenre = true 
}: ArtistBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]}`}>
      <div className="flex items-center gap-1.5">
        <span className={iconSizes[size]}>🎤</span>
        <span className="font-semibold text-white">{artistName}</span>
        {isVerified && (
          <span 
            className="text-neon-cyan" 
            title="Verified Artist"
          >
            ✓
          </span>
        )}
      </div>
      {showGenre && genre && (
        <span className={`${sizeClasses[size]} bg-neon-magenta/20 text-neon-magenta rounded-full`}>
          {genre}
        </span>
      )}
      {!isVerified && (
        <span className={`${sizeClasses[size]} bg-yellow-500/20 text-yellow-400 rounded-full text-xs`}>
          Unverified
        </span>
      )}
    </div>
  );
}

interface ArtistBadgeNFTProps {
  artistName: string;
  genre: string;
  isVerified?: boolean;
  badgeId?: string;
  releaseCount?: number;
  totalPlays?: number;
}

export function ArtistBadgeNFT({ 
  artistName, 
  genre,
  isVerified = false,
  badgeId,
  releaseCount = 0,
  totalPlays = 0,
}: ArtistBadgeNFTProps) {
  return (
    <div className="glass-panel rounded-xl p-6 border border-neon-magenta/30 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-magenta/10 via-transparent to-neon-cyan/10" />
      
      <div className="relative z-10">
        {/* Badge Icon */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-magenta via-neon-purple to-neon-cyan flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
          {isVerified ? (
            <div className="flex items-center gap-1 bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full text-sm">
              <span>✓</span>
              <span>Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
              <span>⚠</span>
              <span>Unverified</span>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="mb-4">
          <h3 className="text-2xl font-grunge text-white">{artistName}</h3>
          <p className="text-neon-magenta">{genre}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center glass-panel rounded-lg p-3">
            <div className="text-xl font-bold text-neon-cyan">{releaseCount}</div>
            <div className="text-xs text-gray-400">Releases</div>
          </div>
          <div className="text-center glass-panel rounded-lg p-3">
            <div className="text-xl font-bold text-neon-green">{totalPlays.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total Plays</div>
          </div>
        </div>

        {/* Badge ID */}
        {badgeId && (
          <div className="text-xs text-gray-500 font-mono">
            Badge: {badgeId.slice(0, 8)}...{badgeId.slice(-8)}
          </div>
        )}

        {/* DRC-369 Label */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-600">
          DRC-369 NFT
        </div>
      </div>
    </div>
  );
}
