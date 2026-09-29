'use client';

import { useState, useEffect } from 'react';
import { MediaViewer } from './MediaViewer';
import { LevelProgressBar } from './LevelProgressBar';
import { ipfsToHttp } from '@/lib/ipfs-client';

interface ViewerTabProps {
  nftId: string | null;
  onBack: () => void;
}

interface ViewerNft {
  id: string;
  name: string;
  description?: string;
  level: number;
  xp: number;
  isSoulbound: boolean;
  creator: string;
  owner: string;
  classId: number;
  createdAt: number;
  updatedAt: number;
  resources: Array<{
    id: string;
    type: string;
    uri: string;
    mimeType?: string;
    priority: number;
  }>;
  equipmentSlots: Array<{ name: string; equippedId?: string; capacity: number }>;
  customState: Record<string, string>;
  delegations: Array<{ delegate: string; permissions: string[]; expiresAt: number }>;
}

export function ViewerTab({ nftId, onBack }: ViewerTabProps) {
  const [nft, setNft] = useState<ViewerNft | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeResourceIndex, setActiveResourceIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (nftId) {
      loadNft(nftId);
    }
  }, [nftId]);

  const loadNft = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/nft/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNft({
          id: data.id || data.tokenId,
          name: data.name || data.metadata?.name || 'Untitled',
          description: data.description || data.metadata?.description,
          level: data.level || 1,
          xp: data.xp || 0,
          isSoulbound: data.isSoulbound || false,
          creator: data.creator || '',
          owner: data.owner || '',
          classId: data.classId || 1,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          resources: data.resources || [],
          equipmentSlots: data.equipmentSlots || [],
          customState: data.customState || {},
          delegations: data.delegations || [],
        });
        setActiveResourceIndex(0);
      }
    } catch (error) {
      console.warn('Could not load NFT:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (xp: number) => {
    const table = [
      { level: 1, cumXp: 0 }, { level: 2, cumXp: 100 }, { level: 3, cumXp: 300 },
      { level: 4, cumXp: 700 }, { level: 5, cumXp: 1500 }, { level: 6, cumXp: 3100 },
      { level: 7, cumXp: 6300 }, { level: 8, cumXp: 12700 }, { level: 9, cumXp: 25500 },
      { level: 10, cumXp: 51100 },
    ];
    let level = 1;
    for (let i = table.length - 1; i >= 0; i--) {
      if (xp >= table[i].cumXp) { level = table[i].level; break; }
    }
    const cur = table.find(l => l.level === level)!;
    const next = table.find(l => l.level === level + 1);
    const xpToNext = next ? next.cumXp - xp : 0;
    const progress = next
      ? Math.min(100, Math.floor(((xp - cur.cumXp) / (next.cumXp - cur.cumXp)) * 100))
      : 100;
    return { level, xpToNext, progress };
  };

  const resourceTypeIcons: Record<string, string> = {
    image: '🖼️', audio: '🎵', video: '🎬', model_3d: '🧊',
    ue5_asset: '🎮', animation: '✨', document: '📄',
  };

  const handleShare = () => {
    const url = `${window.location.origin}/create#viewer?nft=${nftId}`;
    navigator.clipboard.writeText(url);
  };

  if (!nftId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <span className="text-5xl block">🔍</span>
          <div>
            <p className="text-sm text-ink-body font-display tracking-wider">NO ASSET SELECTED</p>
            <p className="text-xs text-ink-muted font-body mt-1">
              Select an asset from the Gallery to view it here
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-display tracking-wider border border-cyber text-cyber hover:bg-cyber hover:text-architect-bg transition-colors"
          >
            GO TO GALLERY
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-2 border-cyber/30 border-t-cyber animate-spin" />
          <p className="text-xs font-display text-ink-muted tracking-wider">LOADING ASSET</p>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <span className="text-4xl block">⚠️</span>
          <p className="text-sm text-ink-body font-display">ASSET NOT FOUND</p>
          <button onClick={onBack} className="text-xs text-cyber hover:underline">Back to Gallery</button>
        </div>
      </div>
    );
  }

  const activeResource = nft.resources[activeResourceIndex];
  const levelInfo = getLevelInfo(nft.xp);

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs font-display text-ink-muted hover:text-white transition-colors"
          >
            ← GALLERY
          </button>
          <div className="h-4 w-px bg-ink-dim/20" />
          <h2 className="text-sm font-display text-white tracking-wider">{nft.name}</h2>
          {nft.isSoulbound && (
            <span className="text-[10px] px-2 py-0.5 bg-steel/10 border border-steel-light/30 text-steel-light font-mono">
              SOULBOUND
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="px-3 py-1.5 text-[10px] font-display tracking-wider border border-ink-dim/20 text-ink-muted hover:text-white hover:border-ink-dim/40 transition-colors"
          >
            {showSidebar ? 'HIDE INFO' : 'SHOW INFO'}
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 text-[10px] font-display tracking-wider border border-cyber/30 text-cyber hover:bg-cyber/10 transition-colors"
          >
            SHARE
          </button>
        </div>
      </div>

      {/* Main Viewer */}
      <div className={`flex gap-4 ${showSidebar ? '' : ''}`}>
        {/* Media Area */}
        <div className="flex-1">
          {/* Resource Tabs */}
          {nft.resources.length > 1 && (
            <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hidden">
              {nft.resources.map((resource, index) => (
                <button
                  key={resource.id || index}
                  onClick={() => setActiveResourceIndex(index)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-display tracking-wider whitespace-nowrap border transition-all
                    ${activeResourceIndex === index
                      ? 'bg-cyber/10 border-cyber/50 text-cyber'
                      : 'border-transparent text-ink-muted hover:text-ink-body'
                    }
                  `}
                >
                  <span>{resourceTypeIcons[resource.type] || '📦'}</span>
                  <span>{resource.type.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Viewer */}
          <div className="glass-panel overflow-hidden" style={{ minHeight: '500px' }}>
            {activeResource ? (
              <MediaViewer
                uri={activeResource.uri}
                type={activeResource.type}
                mimeType={activeResource.mimeType}
                name={nft.name}
              />
            ) : (
              <div className="w-full h-full min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl block mb-3">⬡</span>
                  <p className="text-xs text-ink-dim font-display">NO RESOURCES</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 flex-shrink-0 space-y-3">
            {/* Level */}
            <LevelProgressBar
              currentXp={nft.xp}
              level={levelInfo.level}
              xpToNext={levelInfo.xpToNext}
              progress={levelInfo.progress}
              compact
            />

            {/* Details */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-xs font-display text-ink-muted tracking-wider">DETAILS</h3>

              {nft.description && (
                <p className="text-xs text-ink-body font-body">{nft.description}</p>
              )}

              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-ink-dim">ID</span>
                  <span className="text-ink-body truncate ml-2 max-w-[150px]">{nft.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Creator</span>
                  <span className="text-ink-body truncate ml-2 max-w-[150px]">{nft.creator || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Owner</span>
                  <span className="text-ink-body truncate ml-2 max-w-[150px]">{nft.owner || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Class</span>
                  <span className="text-ink-body">{nft.classId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Created</span>
                  <span className="text-ink-body">{new Date(nft.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Resources</span>
                  <span className="text-ink-body">{nft.resources.length}</span>
                </div>
              </div>
            </div>

            {/* Equipment Slots */}
            {nft.equipmentSlots.length > 0 && (
              <div className="glass-panel p-4 space-y-2">
                <h3 className="text-xs font-display text-ink-muted tracking-wider">EQUIPMENT</h3>
                {nft.equipmentSlots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-ink-body font-mono">{slot.name}</span>
                    {slot.equippedId ? (
                      <span className="text-cyber font-mono truncate max-w-[100px]">{slot.equippedId}</span>
                    ) : (
                      <span className="text-ink-dim">Empty</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Custom State */}
            {Object.keys(nft.customState).length > 0 && (
              <div className="glass-panel p-4 space-y-2">
                <h3 className="text-xs font-display text-ink-muted tracking-wider">STATE</h3>
                {Object.entries(nft.customState).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-[10px]">
                    <span className="text-ink-dim font-mono">{key}</span>
                    <span className="text-ink-body font-mono truncate max-w-[120px]">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Delegations */}
            {nft.delegations.length > 0 && (
              <div className="glass-panel p-4 space-y-2">
                <h3 className="text-xs font-display text-ink-muted tracking-wider">DELEGATIONS</h3>
                {nft.delegations.map((d, i) => (
                  <div key={i} className="text-[10px]">
                    <p className="text-ink-body font-mono truncate">{d.delegate}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.permissions.map((p) => (
                        <span key={p} className="px-1 py-0.5 bg-cyber/10 text-cyber font-mono">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
