'use client';

import { useState } from 'react';
import { ipfsToHttp } from '@/lib/ipfs-client';

export interface NFTCardData {
  id: string;
  name: string;
  description?: string;
  level: number;
  xp: number;
  isSoulbound: boolean;
  resources: Array<{
    id: string;
    type: string;
    uri: string;
    priority: number;
  }>;
  createdAt: number;
  owner: string;
  classId: number;
}

interface NFTCardProps {
  nft: NFTCardData;
  onView?: (id: string) => void;
  onManage?: (id: string) => void;
  onTransfer?: (id: string) => void;
  compact?: boolean;
}

export function NFTCard({ nft, onView, onManage, onTransfer, compact }: NFTCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Get cover image from resources
  const coverResource = nft.resources
    .filter(r => r.type === 'image')
    .sort((a, b) => a.priority - b.priority)[0];

  const coverUrl = coverResource ? ipfsToHttp(coverResource.uri) : null;

  const resourceTypes = [...new Set(nft.resources.map(r => r.type))];

  const resourceTypeIcons: Record<string, string> = {
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
    model_3d: '🧊',
    ue5_asset: '🎮',
    animation: '✨',
    document: '📄',
  };

  if (compact) {
    return (
      <button
        onClick={() => onView?.(nft.id)}
        className="flex items-center gap-3 p-3 w-full text-left glass-panel hover:border-cyber/40 transition-all group"
      >
        <div className="w-12 h-12 bg-architect-surface border border-ink-dim/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {coverUrl && !imgError ? (
            <img src={coverUrl} alt={nft.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <span className="text-xl">⬡</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate font-display tracking-wide">{nft.name}</p>
          <p className="text-[10px] text-ink-muted">LVL {nft.level} · {nft.xp} XP</p>
        </div>
        <span className="text-cyber opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</span>
      </button>
    );
  }

  return (
    <div
      className="glass-panel overflow-hidden group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Cover Image */}
      <div className="aspect-square bg-architect-surface relative overflow-hidden">
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-architect-surface to-architect-bg">
            <div className="text-center">
              <span className="text-4xl block mb-2">⬡</span>
              <span className="text-[10px] text-ink-dim font-mono">DRC-369</span>
            </div>
          </div>
        )}

        {/* Level Badge */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 border border-cyber/30">
          <span className="text-[10px] font-mono text-cyber">LVL {nft.level}</span>
        </div>

        {/* Soulbound Badge */}
        {nft.isSoulbound && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 border border-steel-light/30">
            <span className="text-[10px] font-mono text-steel-light">🔒 SOUL</span>
          </div>
        )}

        {/* Resource Types */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {resourceTypes.map((type) => (
            <div key={type} className="bg-black/70 backdrop-blur-sm px-1.5 py-0.5 border border-ink-dim/20">
              <span className="text-xs" title={type}>
                {resourceTypeIcons[type] || '📦'}
              </span>
            </div>
          ))}
        </div>

        {/* Hover Actions */}
        <div className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2
          transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}
        `}>
          {onView && (
            <button
              onClick={() => onView(nft.id)}
              className="px-3 py-2 bg-cyber/20 border border-cyber/50 text-cyber text-xs font-display tracking-wider hover:bg-cyber/30 transition-colors"
            >
              VIEW
            </button>
          )}
          {onManage && (
            <button
              onClick={() => onManage(nft.id)}
              className="px-3 py-2 bg-steel/20 border border-steel-light/50 text-steel-light text-xs font-display tracking-wider hover:bg-steel/30 transition-colors"
            >
              MANAGE
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm text-white font-display tracking-wide truncate">{nft.name}</h3>
        {nft.description && (
          <p className="text-[11px] text-ink-muted mt-1 line-clamp-2 font-body">{nft.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-dim/10">
          <span className="text-[10px] text-ink-dim font-mono">{nft.xp} XP</span>
          <span className="text-[10px] text-ink-dim font-mono">
            {new Date(nft.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
