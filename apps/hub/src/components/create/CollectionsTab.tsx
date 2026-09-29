'use client';

import { useState, useEffect } from 'react';
import { NFTCard, type NFTCardData } from './NFTCard';

interface CollectionsTabProps {
  onViewNft: (id: string) => void;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  nftIds: string[];
  isPublic: boolean;
  createdAt: number;
}

export function CollectionsTab({ onViewNft }: CollectionsTabProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [nfts, setNfts] = useState<NFTCardData[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load NFTs
      const nftResponse = await fetch('/api/nft/store');
      if (nftResponse.ok) {
        const data = await nftResponse.json();
        const mapped: NFTCardData[] = (data.nfts || []).map((nft: any) => ({
          id: nft.id || nft.tokenId,
          name: nft.name || nft.metadata?.name || 'Untitled',
          description: nft.description,
          level: nft.level || 1,
          xp: nft.xp || 0,
          isSoulbound: nft.isSoulbound || false,
          resources: nft.resources || [],
          createdAt: nft.createdAt || Date.now(),
          owner: nft.owner || '',
          classId: nft.classId || 1,
        }));
        setNfts(mapped);

        // Group into collections by classId for now
        const classGroups = new Map<number, NFTCardData[]>();
        mapped.forEach((nft) => {
          const existing = classGroups.get(nft.classId) || [];
          existing.push(nft);
          classGroups.set(nft.classId, existing);
        });

        // Load saved collections from localStorage
        const savedCollections = JSON.parse(localStorage.getItem('drc369-collections') || '[]');
        setCollections(savedCollections);
      }
    } catch (error) {
      console.warn('Could not load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = () => {
    if (!newName.trim()) return;

    const collection: Collection = {
      id: `col-${Date.now()}`,
      name: newName,
      description: newDescription,
      nftIds: [],
      isPublic: newIsPublic,
      createdAt: Date.now(),
    };

    const updated = [...collections, collection];
    setCollections(updated);
    localStorage.setItem('drc369-collections', JSON.stringify(updated));

    setNewName('');
    setNewDescription('');
    setShowCreateForm(false);
  };

  const deleteCollection = (id: string) => {
    const updated = collections.filter(c => c.id !== id);
    setCollections(updated);
    localStorage.setItem('drc369-collections', JSON.stringify(updated));
    if (selectedCollection?.id === id) setSelectedCollection(null);
  };

  const toggleNftInCollection = (collectionId: string, nftId: string) => {
    const updated = collections.map(c => {
      if (c.id !== collectionId) return c;
      const nftIds = c.nftIds.includes(nftId)
        ? c.nftIds.filter(id => id !== nftId)
        : [...c.nftIds, nftId];
      return { ...c, nftIds };
    });
    setCollections(updated);
    localStorage.setItem('drc369-collections', JSON.stringify(updated));
    if (selectedCollection) {
      setSelectedCollection(updated.find(c => c.id === selectedCollection.id) || null);
    }
  };

  if (selectedCollection) {
    const collectionNfts = nfts.filter(n => selectedCollection.nftIds.includes(n.id));
    const availableNfts = nfts.filter(n => !selectedCollection.nftIds.includes(n.id));

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCollection(null)}
              className="text-xs font-display text-ink-muted hover:text-white transition-colors"
            >
              ← BACK
            </button>
            <div>
              <h2 className="text-lg font-display text-white tracking-wider">{selectedCollection.name}</h2>
              <p className="text-xs text-ink-muted font-body">{selectedCollection.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 border ${selectedCollection.isPublic ? 'border-cyber/30 text-cyber' : 'border-ink-dim/30 text-ink-dim'}`}>
              {selectedCollection.isPublic ? 'PUBLIC' : 'PRIVATE'}
            </span>
            <span className="text-xs font-mono text-ink-dim">{collectionNfts.length} items</span>
          </div>
        </div>

        {/* Collection NFTs */}
        {collectionNfts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {collectionNfts.map((nft) => (
              <div key={nft.id} className="relative group">
                <NFTCard nft={nft} onView={onViewNft} />
                <button
                  onClick={() => toggleNftInCollection(selectedCollection.id, nft.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-signal-error/80 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Remove from collection"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-3xl block mb-2">📂</span>
            <p className="text-xs text-ink-muted font-display">EMPTY COLLECTION</p>
          </div>
        )}

        {/* Add NFTs */}
        {availableNfts.length > 0 && (
          <div>
            <h3 className="text-xs font-display text-ink-muted tracking-wider mb-3">ADD ASSETS</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {availableNfts.map((nft) => (
                <button
                  key={nft.id}
                  onClick={() => toggleNftInCollection(selectedCollection.id, nft.id)}
                  className="glass-panel p-2 hover:border-cyber/40 transition-all group text-left"
                >
                  <div className="aspect-square bg-architect-surface flex items-center justify-center mb-1 overflow-hidden">
                    <span className="text-xl">⬡</span>
                  </div>
                  <p className="text-[10px] text-ink-body truncate">{nft.name}</p>
                  <span className="text-[10px] text-cyber opacity-0 group-hover:opacity-100 transition-opacity">+ Add</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display text-white tracking-wider">COLLECTIONS</h2>
          <p className="text-xs text-ink-muted font-body mt-1">Organize your DRC-369 assets into collections</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 text-xs font-display tracking-wider border border-cyber text-cyber hover:bg-cyber hover:text-architect-bg transition-colors"
        >
          {showCreateForm ? 'CANCEL' : '+ NEW COLLECTION'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-display text-white tracking-wider">CREATE COLLECTION</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewIsPublic(!newIsPublic)}
                className={`w-10 h-6 relative transition-colors ${newIsPublic ? 'bg-cyber/50' : 'bg-ink-dim/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white transition-all ${newIsPublic ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-xs text-ink-body">{newIsPublic ? 'Public' : 'Private'}</span>
            </div>
            <button
              onClick={createCollection}
              disabled={!newName.trim()}
              className="px-4 py-2 text-xs font-display tracking-wider border border-cyber text-cyber hover:bg-cyber hover:text-architect-bg disabled:opacity-30 transition-colors"
            >
              CREATE
            </button>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-cyber/30 border-t-cyber animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">📁</span>
          <p className="text-sm text-ink-body font-display tracking-wider">NO COLLECTIONS YET</p>
          <p className="text-xs text-ink-muted font-body mt-1">Create a collection to organize your assets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div key={collection.id} className="glass-panel overflow-hidden group">
              <button
                onClick={() => setSelectedCollection(collection)}
                className="w-full text-left"
              >
                <div className="h-32 bg-gradient-to-br from-cyber/5 to-steel/5 flex items-center justify-center">
                  <span className="text-4xl opacity-30">📁</span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm text-white font-display tracking-wider">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-[11px] text-ink-muted mt-1 line-clamp-1 font-body">{collection.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-ink-dim">
                    <span>{collection.nftIds.length} items</span>
                    <span>{collection.isPublic ? '🌐 Public' : '🔒 Private'}</span>
                  </div>
                </div>
              </button>
              <div className="px-4 pb-3">
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="text-[10px] text-signal-error/60 hover:text-signal-error font-mono transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
