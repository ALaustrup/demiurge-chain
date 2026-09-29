'use client';

import { useState, useEffect } from 'react';
import { LevelProgressBar } from './LevelProgressBar';
import { NFTCard, type NFTCardData } from './NFTCard';
import { ipfsToHttp } from '@/lib/ipfs-client';

interface ManageTabProps {
  selectedNftId: string | null;
  onSelectNft: (id: string | null) => void;
}

interface ManagedNft extends NFTCardData {
  equipmentSlots: Array<{ name: string; equippedId?: string; capacity: number }>;
  delegations: Array<{ delegate: string; permissions: string[]; expiresAt: number }>;
  customState: Record<string, string>;
}

export function ManageTab({ selectedNftId, onSelectNft }: ManageTabProps) {
  const [nfts, setNfts] = useState<NFTCardData[]>([]);
  const [selectedNft, setSelectedNft] = useState<ManagedNft | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'xp' | 'resources' | 'equipment' | 'state' | 'delegation'>('xp');

  // XP form state
  const [xpAmount, setXpAmount] = useState(0);
  const [xpReason, setXpReason] = useState('');
  const [xpLoading, setXpLoading] = useState(false);

  // State form
  const [stateKey, setStateKey] = useState('');
  const [stateValue, setStateValue] = useState('');

  // Delegation form
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegatePermissions, setDelegatePermissions] = useState<string[]>([]);

  useEffect(() => {
    loadNfts();
  }, []);

  useEffect(() => {
    if (selectedNftId) {
      loadNftDetails(selectedNftId);
    }
  }, [selectedNftId]);

  const loadNfts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nft/store');
      if (response.ok) {
        const data = await response.json();
        const mapped: NFTCardData[] = (data.nfts || []).map((nft: any) => ({
          id: nft.id || nft.tokenId,
          name: nft.name || nft.metadata?.name || 'Untitled',
          description: nft.description || nft.metadata?.description,
          level: nft.level || 1,
          xp: nft.xp || 0,
          isSoulbound: nft.isSoulbound || false,
          resources: nft.resources || [],
          createdAt: nft.createdAt || Date.now(),
          owner: nft.owner || '',
          classId: nft.classId || 1,
        }));
        setNfts(mapped);
      }
    } catch (error) {
      console.warn('Could not load NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNftDetails = async (nftId: string) => {
    try {
      const response = await fetch(`/api/nft/${nftId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedNft({
          id: data.id || data.tokenId,
          name: data.name || data.metadata?.name || 'Untitled',
          description: data.description || data.metadata?.description,
          level: data.level || 1,
          xp: data.xp || 0,
          isSoulbound: data.isSoulbound || false,
          resources: data.resources || [],
          createdAt: data.createdAt || Date.now(),
          owner: data.owner || '',
          classId: data.classId || 1,
          equipmentSlots: data.equipmentSlots || [],
          delegations: data.delegations || [],
          customState: data.customState || {},
        });
      }
    } catch (error) {
      console.warn('Could not load NFT details:', error);
      // Create a basic version from the list
      const fromList = nfts.find(n => n.id === nftId);
      if (fromList) {
        setSelectedNft({
          ...fromList,
          equipmentSlots: [],
          delegations: [],
          customState: {},
        });
      }
    }
  };

  const handleAddXp = async () => {
    if (!selectedNft || xpAmount <= 0) return;
    setXpLoading(true);
    try {
      const response = await fetch(`/api/nft/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedNft.id,
          action: 'addXp',
          amount: xpAmount,
          reason: xpReason,
        }),
      });
      if (response.ok) {
        await loadNftDetails(selectedNft.id);
        setXpAmount(0);
        setXpReason('');
      }
    } catch (error) {
      console.error('Failed to add XP:', error);
    } finally {
      setXpLoading(false);
    }
  };

  const handleUpdateState = async () => {
    if (!selectedNft || !stateKey) return;
    try {
      await fetch(`/api/nft/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedNft.id,
          action: 'updateState',
          key: stateKey,
          value: stateValue,
        }),
      });
      await loadNftDetails(selectedNft.id);
      setStateKey('');
      setStateValue('');
    } catch (error) {
      console.error('Failed to update state:', error);
    }
  };

  // Calculate level progress
  const getLevelInfo = (xp: number) => {
    const levelTable = [
      { level: 1, cumXp: 0 }, { level: 2, cumXp: 100 }, { level: 3, cumXp: 300 },
      { level: 4, cumXp: 700 }, { level: 5, cumXp: 1500 }, { level: 6, cumXp: 3100 },
      { level: 7, cumXp: 6300 }, { level: 8, cumXp: 12700 }, { level: 9, cumXp: 25500 },
      { level: 10, cumXp: 51100 },
    ];
    let level = 1;
    for (let i = levelTable.length - 1; i >= 0; i--) {
      if (xp >= levelTable[i].cumXp) { level = levelTable[i].level; break; }
    }
    const currentLvl = levelTable.find(l => l.level === level)!;
    const nextLvl = levelTable.find(l => l.level === level + 1);
    const xpToNext = nextLvl ? nextLvl.cumXp - xp : 0;
    const progress = nextLvl
      ? Math.min(100, Math.floor(((xp - currentLvl.cumXp) / (nextLvl.cumXp - currentLvl.cumXp)) * 100))
      : 100;
    return { level, xpToNext, progress };
  };

  const SECTIONS = [
    { id: 'xp' as const, label: 'XP & Level', icon: '⚡' },
    { id: 'resources' as const, label: 'Resources', icon: '📁' },
    { id: 'equipment' as const, label: 'Equipment', icon: '🎒' },
    { id: 'state' as const, label: 'State', icon: '📊' },
    { id: 'delegation' as const, label: 'Delegation', icon: '🔑' },
  ];

  const PERMISSIONS = ['transfer', 'update_state', 'add_xp', 'equip', 'add_resource', 'delegate', 'burn', 'all'];

  if (!selectedNftId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-display text-white tracking-wider">SELECT AN ASSET TO MANAGE</h2>
          <p className="text-xs text-ink-muted font-body mt-1">
            Choose an NFT from your collection to manage its properties
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-cyber/30 border-t-cyber animate-spin" />
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">⬡</span>
            <p className="text-sm text-ink-muted font-display">NO ASSETS TO MANAGE</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onView={(id) => onSelectNft(id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const levelInfo = selectedNft ? getLevelInfo(selectedNft.xp) : { level: 1, xpToNext: 100, progress: 0 };

  return (
    <div className="space-y-6">
      {/* Selected NFT Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onSelectNft(null)}
          className="text-xs font-display text-ink-muted hover:text-white transition-colors"
        >
          ← BACK
        </button>
        {selectedNft && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-architect-surface border border-ink-dim/20 flex items-center justify-center overflow-hidden">
              {selectedNft.resources[0]?.type === 'image' ? (
                <img src={ipfsToHttp(selectedNft.resources[0].uri)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">⬡</span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-display text-white tracking-wider">{selectedNft.name}</h2>
              <p className="text-[10px] font-mono text-ink-dim">{selectedNft.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Level Progress */}
      {selectedNft && (
        <LevelProgressBar
          currentXp={selectedNft.xp}
          level={levelInfo.level}
          xpToNext={levelInfo.xpToNext}
          progress={levelInfo.progress}
        />
      )}

      {/* Section Nav */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hidden">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-[11px] font-display tracking-wider whitespace-nowrap border transition-all
              ${activeSection === section.id
                ? 'bg-cyber/10 border-cyber/50 text-cyber'
                : 'border-transparent text-ink-muted hover:text-ink-body'
              }
            `}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="glass-panel p-5">
        {/* XP Section */}
        {activeSection === 'xp' && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white tracking-wider">ADD EXPERIENCE POINTS</h3>
            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                value={xpAmount || ''}
                onChange={(e) => setXpAmount(Number(e.target.value))}
                placeholder="XP Amount"
                className="w-32 bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                placeholder="Reason (optional)"
                className="flex-1 bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white"
              />
              <button
                onClick={handleAddXp}
                disabled={xpLoading || xpAmount <= 0}
                className={`
                  px-4 py-2 text-xs font-display tracking-wider border transition-colors
                  ${xpAmount > 0 ? 'border-cyber text-cyber hover:bg-cyber hover:text-architect-bg' : 'border-ink-dim/20 text-ink-dim'}
                `}
              >
                {xpLoading ? '...' : '+ ADD XP'}
              </button>
            </div>
          </div>
        )}

        {/* Resources Section */}
        {activeSection === 'resources' && selectedNft && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white tracking-wider">
              RESOURCES ({selectedNft.resources.length})
            </h3>
            {selectedNft.resources.length === 0 ? (
              <p className="text-xs text-ink-dim text-center py-8">No resources attached</p>
            ) : (
              <div className="space-y-2">
                {selectedNft.resources.map((resource, i) => (
                  <div key={resource.id || i} className="flex items-center gap-3 p-3 bg-architect-surface border border-ink-dim/10">
                    <div className="w-10 h-10 bg-architect-bg border border-ink-dim/20 flex items-center justify-center overflow-hidden">
                      {resource.type === 'image' ? (
                        <img src={ipfsToHttp(resource.uri)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">
                          {{'audio':'🎵','video':'🎬','model_3d':'🧊','ue5_asset':'🎮'}[resource.type] || '📦'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-mono truncate">{resource.type}</p>
                      <p className="text-[10px] text-ink-dim font-mono truncate">{resource.uri}</p>
                    </div>
                    <span className="text-[10px] text-ink-dim font-mono">P:{resource.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Equipment Section */}
        {activeSection === 'equipment' && selectedNft && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white tracking-wider">EQUIPMENT SLOTS</h3>
            {selectedNft.equipmentSlots.length === 0 ? (
              <p className="text-xs text-ink-dim text-center py-8">No equipment slots configured</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedNft.equipmentSlots.map((slot, i) => (
                  <div key={i} className="p-3 bg-architect-surface border border-ink-dim/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white font-display tracking-wider">{slot.name.toUpperCase()}</span>
                      <span className="text-[10px] font-mono text-ink-dim">Cap: {slot.capacity}</span>
                    </div>
                    {slot.equippedId ? (
                      <div className="flex items-center gap-2 p-2 bg-cyber/5 border border-cyber/20">
                        <span className="text-xs">⬡</span>
                        <span className="text-[10px] font-mono text-cyber truncate">{slot.equippedId}</span>
                      </div>
                    ) : (
                      <div className="p-2 border border-dashed border-ink-dim/20 text-center">
                        <span className="text-[10px] text-ink-dim">Empty slot</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom State Section */}
        {activeSection === 'state' && selectedNft && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white tracking-wider">CUSTOM STATE</h3>

            {/* Existing state */}
            {Object.keys(selectedNft.customState).length > 0 && (
              <div className="space-y-1">
                {Object.entries(selectedNft.customState).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-architect-surface border border-ink-dim/10">
                    <span className="text-xs font-mono text-ink-muted">{key}:</span>
                    <span className="text-xs font-mono text-white">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Update state */}
            <div className="flex gap-2">
              <input
                type="text"
                value={stateKey}
                onChange={(e) => setStateKey(e.target.value)}
                placeholder="Key"
                className="w-40 bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
                placeholder="Value"
                className="flex-1 bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white"
              />
              <button
                onClick={handleUpdateState}
                disabled={!stateKey}
                className="px-3 py-2 text-xs font-display tracking-wider border border-cyber/50 text-cyber hover:bg-cyber/10 disabled:opacity-30 transition-colors"
              >
                SET
              </button>
            </div>
          </div>
        )}

        {/* Delegation Section */}
        {activeSection === 'delegation' && selectedNft && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white tracking-wider">DELEGATION</h3>

            {/* Existing delegations */}
            {selectedNft.delegations.length > 0 && (
              <div className="space-y-2">
                {selectedNft.delegations.map((d, i) => (
                  <div key={i} className="p-3 bg-architect-surface border border-ink-dim/10">
                    <p className="text-xs font-mono text-white truncate">{d.delegate}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.permissions.map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 bg-cyber/10 text-cyber font-mono">{p}</span>
                      ))}
                    </div>
                    {d.expiresAt > 0 && (
                      <p className="text-[10px] text-ink-dim mt-1 font-mono">
                        Expires: {new Date(d.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Grant delegation */}
            <div className="space-y-3 p-3 border border-dashed border-ink-dim/20">
              <p className="text-xs font-display text-ink-muted tracking-wider">GRANT DELEGATION</p>
              <input
                type="text"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
                placeholder="Delegate address"
                className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white font-mono"
              />
              <div className="flex flex-wrap gap-1">
                {PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    onClick={() => {
                      setDelegatePermissions(prev =>
                        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
                      );
                    }}
                    className={`
                      text-[10px] px-2 py-1 font-mono border transition-colors
                      ${delegatePermissions.includes(perm)
                        ? 'bg-cyber/10 border-cyber/50 text-cyber'
                        : 'border-ink-dim/20 text-ink-dim hover:text-ink-body'
                      }
                    `}
                  >
                    {perm}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
