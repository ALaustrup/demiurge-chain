'use client';

import { useState, useEffect } from 'react';
import { NFTCard, type NFTCardData } from './NFTCard';

interface GalleryTabProps {
  onViewNft: (id: string) => void;
  onManageNft: (id: string) => void;
}

type SortOption = 'newest' | 'level' | 'xp' | 'name';
type FilterType = 'all' | 'image' | 'audio' | 'video' | 'model_3d' | 'soulbound';

export function GalleryTab({ onViewNft, onManageNft }: GalleryTabProps) {
  const [nfts, setNfts] = useState<NFTCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadNfts();
  }, []);

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
          resources: nft.resources || (nft.metadata?.image ? [{
            id: '1',
            type: 'image',
            uri: nft.metadata.image,
            priority: 0,
          }] : []),
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

  // Apply filters and sorting
  const filteredNfts = nfts
    .filter((nft) => {
      if (filterType === 'soulbound') return nft.isSoulbound;
      if (filterType !== 'all') {
        return nft.resources.some(r => r.type === filterType);
      }
      return true;
    })
    .filter((nft) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return nft.name.toLowerCase().includes(q) ||
        (nft.description?.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.createdAt - a.createdAt;
        case 'level': return b.level - a.level;
        case 'xp': return b.xp - a.xp;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white font-body placeholder:text-ink-dim"
          />
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-ink-body font-mono"
        >
          <option value="all">All Types</option>
          <option value="image">🖼️ Images</option>
          <option value="audio">🎵 Audio</option>
          <option value="video">🎬 Video</option>
          <option value="model_3d">🧊 3D Models</option>
          <option value="soulbound">🔒 Soulbound</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-ink-body font-mono"
        >
          <option value="newest">Newest First</option>
          <option value="level">Highest Level</option>
          <option value="xp">Most XP</option>
          <option value="name">Name A-Z</option>
        </select>

        {/* View Toggle */}
        <div className="flex border border-ink-dim/20">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 text-xs ${viewMode === 'grid' ? 'bg-cyber/10 text-cyber' : 'text-ink-muted hover:text-ink-body'}`}
          >
            ⊞
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-xs ${viewMode === 'list' ? 'bg-cyber/10 text-cyber' : 'text-ink-muted hover:text-ink-body'}`}
          >
            ☰
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={loadNfts}
          className="px-3 py-2 border border-ink-dim/20 text-xs text-ink-muted hover:text-cyber hover:border-cyber/30 transition-colors"
        >
          ↻
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 text-[10px] font-mono text-ink-dim">
        <span>{filteredNfts.length} asset{filteredNfts.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{nfts.filter(n => n.isSoulbound).length} soulbound</span>
        <span>·</span>
        <span>Avg LVL {nfts.length > 0 ? Math.round(nfts.reduce((s, n) => s + n.level, 0) / nfts.length) : 0}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto border-2 border-cyber/30 border-t-cyber animate-spin" />
            <p className="text-xs font-display text-ink-muted tracking-wider">LOADING ASSETS</p>
          </div>
        </div>
      ) : filteredNfts.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <span className="text-5xl block">⬡</span>
            <div>
              <p className="text-sm text-ink-body font-display tracking-wider">NO ASSETS FOUND</p>
              <p className="text-xs text-ink-muted font-body mt-1">
                {nfts.length === 0
                  ? 'Mint your first DRC-369 asset to get started'
                  : 'Try adjusting your filters'
                }
              </p>
            </div>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredNfts.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onView={onViewNft}
              onManage={onManageNft}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredNfts.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onView={onViewNft}
              onManage={onManageNft}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
