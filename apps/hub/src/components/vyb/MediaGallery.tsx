'use client';

import { useState, useRef } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import type { GalleryItem } from '@/lib/vyb/types';

interface MintModalData {
  item: GalleryItem;
  name: string;
  description: string;
  royaltyPercent: number;
}

export function MediaGallery() {
  const { gallery, isLoadingGallery, uploadMedia, mintMedia, refreshGallery } = useVYB();
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [mintModal, setMintModal] = useState<MintModalData | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadMedia(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMint = async () => {
    if (!mintModal) return;

    setIsMinting(true);
    try {
      const result = await mintMedia(mintModal.item.id, {
        name: mintModal.name,
        description: mintModal.description,
        royaltyPercent: mintModal.royaltyPercent,
      });

      if (result.success) {
        setMintModal(null);
        refreshGallery();
      }
    } catch (error) {
      console.error('Minting failed:', error);
    } finally {
      setIsMinting(false);
    }
  };

  const getDaysRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoadingGallery) {
    return (
      <div className="glass-panel p-8 rounded-xl">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-grunge-alt text-2xl text-neon-cyan">📸 Media Gallery</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="neon-button px-4 py-2 rounded-lg text-sm"
          >
            {isUploading ? '📤 Uploading...' : '📤 Upload'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
        <p className="text-sm text-yellow-400">
          ⚠️ Media is stored for <strong>3 months</strong>. Mint to NFT to keep permanently on-chain!
        </p>
      </div>

      {/* Gallery Grid */}
      {gallery.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📷</p>
          <p className="text-gray-400 mb-4">No media uploaded yet</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="neon-button px-6 py-2 rounded-lg"
          >
            Upload Your First Media
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-blockchain-light cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {/* Media */}
              {item.type === 'image' && (
                <img 
                  src={item.thumbnailUrl || item.url} 
                  alt={item.title || 'Media'} 
                  className="w-full h-full object-cover"
                />
              )}
              {item.type === 'video' && (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                  <span className="text-4xl">🎬</span>
                </div>
              )}
              {item.type === 'audio' && (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900 to-teal-900">
                  <span className="text-4xl">🎵</span>
                </div>
              )}

              {/* NFT Badge */}
              {item.isMinted && (
                <div className="absolute top-2 right-2 bg-purple-500/90 px-2 py-1 rounded text-xs font-bold">
                  NFT
                </div>
              )}

              {/* Expiry Warning */}
              {!item.isMinted && getDaysRemaining(item.expiresAt) <= 14 && (
                <div className="absolute top-2 left-2 bg-red-500/90 px-2 py-1 rounded text-xs">
                  {getDaysRemaining(item.expiresAt)}d left
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-white text-sm font-body line-clamp-1">{item.title || 'Untitled'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span>👁️ {item.views}</span>
                  <span>❤️ {item.likes}</span>
                </div>
                
                {/* Mint Button */}
                {!item.isMinted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMintModal({
                        item,
                        name: item.title || 'My NFT',
                        description: item.description || '',
                        royaltyPercent: 10,
                      });
                    }}
                    className="neon-button px-4 py-1 rounded text-xs mt-2"
                  >
                    ✨ Mint This
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Item Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="glass-panel liquid-border max-w-4xl max-h-[90vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Preview */}
            <div className="relative bg-blockchain-dark">
              {selectedItem.type === 'image' && (
                <img 
                  src={selectedItem.url} 
                  alt={selectedItem.title || 'Media'} 
                  className="max-h-[60vh] w-auto mx-auto"
                />
              )}
              {selectedItem.type === 'video' && (
                <video 
                  src={selectedItem.url} 
                  controls 
                  className="max-h-[60vh] w-auto mx-auto"
                />
              )}
              {selectedItem.type === 'audio' && (
                <div className="p-12 text-center">
                  <span className="text-8xl">🎵</span>
                  <audio src={selectedItem.url} controls className="mt-4 w-full" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-grunge-alt text-xl text-white">{selectedItem.title || 'Untitled'}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-400 text-sm mt-1">{selectedItem.description}</p>
                  )}
                </div>
                {selectedItem.isMinted ? (
                  <span className="bg-purple-500 px-3 py-1 rounded-lg text-sm">NFT #{selectedItem.nftId}</span>
                ) : (
                  <span className="text-yellow-400 text-sm">
                    Expires in {getDaysRemaining(selectedItem.expiresAt)} days
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span>👁️ {selectedItem.views} views</span>
                <span>❤️ {selectedItem.likes} likes</span>
                <span>🏷️ {selectedItem.tags.join(', ') || 'No tags'}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!selectedItem.isMinted && (
                  <button
                    onClick={() => {
                      setMintModal({
                        item: selectedItem,
                        name: selectedItem.title || 'My NFT',
                        description: selectedItem.description || '',
                        royaltyPercent: 10,
                      });
                      setSelectedItem(null);
                    }}
                    className="neon-button px-6 py-2 rounded-lg"
                  >
                    ✨ Mint as NFT
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="glass-panel px-6 py-2 rounded-lg hover:border-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mint Modal */}
      {mintModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => !isMinting && setMintModal(null)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-md rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-grunge text-2xl text-neon-cyan mb-2">✨ Mint as DRC-369 NFT</h3>
            <p className="text-gray-400 text-sm mb-6">
              Turn your media into a permanent on-chain asset
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">NFT Name</label>
                <input
                  type="text"
                  value={mintModal.name}
                  onChange={(e) => setMintModal({ ...mintModal, name: e.target.value })}
                  className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                  placeholder="My Awesome NFT"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={mintModal.description}
                  onChange={(e) => setMintModal({ ...mintModal, description: e.target.value })}
                  className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 resize-none h-20"
                  placeholder="Describe your NFT..."
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Royalty Percentage</label>
                <input
                  type="number"
                  value={mintModal.royaltyPercent}
                  onChange={(e) => setMintModal({ ...mintModal, royaltyPercent: Number(e.target.value) })}
                  min="0"
                  max="50"
                  className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">You'll earn {mintModal.royaltyPercent}% on future sales</p>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-green-400">
                🔒 Once minted, your media will be permanently stored on the Demiurge blockchain
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMintModal(null)}
                disabled={isMinting}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                disabled={isMinting || !mintModal.name}
                className="flex-1 neon-button py-2 rounded-lg disabled:opacity-50"
              >
                {isMinting ? '✨ Minting...' : '✨ Mint NFT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
