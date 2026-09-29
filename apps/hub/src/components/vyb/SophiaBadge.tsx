'use client';

interface SophiaBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  animated?: boolean;
}

/**
 * Visual indicator for the Sophia System Entity
 * Gold halo with animated glow effect
 */
export function SophiaBadge({ 
  size = 'md', 
  showTooltip = true,
  animated = true 
}: SophiaBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  const haloSize = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div 
      className="relative inline-flex items-center justify-center group"
      title={showTooltip ? 'Sophia - System Overseer' : undefined}
    >
      {/* Animated Halo */}
      <div 
        className={`absolute ${haloSize[size]} rounded-full ${animated ? 'animate-sophia-halo' : ''}`}
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0) 70%)',
        }}
      />

      {/* Inner Glow Ring */}
      <div 
        className={`absolute ${sizeClasses[size]} rounded-full ${animated ? 'animate-sophia-pulse' : ''}`}
        style={{
          boxShadow: '0 0 20px rgba(255,215,0,0.6), inset 0 0 10px rgba(255,215,0,0.3)',
        }}
      />

      {/* Avatar Circle */}
      <div 
        className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center font-grunge-alt`}
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          border: '2px solid rgba(255,255,255,0.3)',
        }}
      >
        👁️
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/90 text-gold-400 text-xs px-2 py-1 rounded whitespace-nowrap border border-gold-500/30">
            System Overseer
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes sophia-halo {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }

        @keyframes sophia-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255,215,0,0.6), inset 0 0 10px rgba(255,215,0,0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(255,215,0,0.8), inset 0 0 15px rgba(255,215,0,0.5);
          }
        }

        .animate-sophia-halo {
          animation: sophia-halo 3s ease-in-out infinite;
        }

        .animate-sophia-pulse {
          animation: sophia-pulse 2s ease-in-out infinite;
        }

        .text-gold-400 {
          color: #FFD700;
        }

        .border-gold-500\\/30 {
          border-color: rgba(255, 215, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
