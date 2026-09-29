'use client';

import { useState } from 'react';
import type { Drc369Asset } from '@demiurge/qor-sdk';

interface MarketplaceListingProps {
  asset: Drc369Asset;
  sellerLevel: number;
  sellerQorId: string;
  price: number;
  onPurchase?: (assetUuid: string) => void;
}

export function MarketplaceListing({
  asset,
  sellerLevel,
  sellerQorId,
  price,
  onPurchase,
}: MarketplaceListingProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Calculate trust badge based on level
  const getTrustBadge = () => {
    if (sellerLevel >= 50) {
      return {
        text: 'Creator God',
        color: 'text-demiurge-gold',
        glow: 'shadow-[0_0_20px_rgba(255,215,0,0.5)]',
      };
    } else if (sellerLevel >= 20) {
      return {
        text: 'Disciple',
        color: 'text-demiurge-violet',
        glow: 'shadow-[0_0_15px_rgba(112,0,255,0.4)]',
      };
    }
    return {
      text: 'Awakening',
      color: 'text-demiurge-cyan',
      glow: '',
    };
  };

  const trustBadge = getTrustBadge();

  return (
    <div
      className="glass-panel p-6 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowPreview(!showPreview)}
    >
      {/* Asset Preview */}
      <div className="aspect-square bg-gradient-to-br from-demiurge-cyan/20 to-demiurge-violet/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        {asset.metadata.image ? (
          <img
            src={asset.metadata.image}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-sm">No Preview</div>
        )}
        
        {/* 3D Preview Overlay (on hover) */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-demiurge-cyan text-sm">3D Preview</div>
          </div>
        )}
      </div>

      {/* Asset Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">{asset.name}</h3>
        
        {/* Seller Info with Trust Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Seller:</span>
            <span className="text-sm text-demiurge-cyan">{sellerQorId}</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold ${trustBadge.color} ${trustBadge.glow}`}>
            {trustBadge.text} Lv.{sellerLevel}
          </div>
        </div>

        {/* Asset Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Type:</span>
          <span className="text-xs text-white capitalize">{asset.assetType}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-demiurge-cyan/20">
          <span className="text-sm text-gray-400">Price:</span>
          <span className="text-lg font-bold text-demiurge-gold">{price} CGT</span>
        </div>

        {/* Purchase Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPurchase?.(asset.uuid);
          }}
          className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all font-bold mt-4"
        >
          Purchase
        </button>
      </div>

      {/* Expanded Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">{asset.name}</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Large Preview */}
            <div className="aspect-video bg-gradient-to-br from-demiurge-cyan/20 to-demiurge-violet/20 rounded-lg mb-6 flex items-center justify-center">
              {asset.metadata.image ? (
                <img
                  src={asset.metadata.image}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400">No Preview Available</div>
              )}
            </div>

            {/* Asset Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-2">Description</h3>
                <p className="text-white">
                  {asset.metadata.description || 'No description available'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">Creator</h3>
                  <p className="text-demiurge-cyan">{asset.creatorQorId}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">Type</h3>
                  <p className="text-white capitalize">{asset.assetType}</p>
                </div>
              </div>

              {/* Attributes */}
              {asset.metadata.attributes && (
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">Attributes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(asset.metadata.attributes).map(([key, value]) => (
                      <div key={key} className="glass-panel p-2 rounded">
                        <div className="text-xs text-gray-400">{key}</div>
                        <div className="text-sm text-white">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Section */}
              <div className="pt-4 border-t border-demiurge-cyan/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl text-gray-300">Total Price</span>
                  <span className="text-3xl font-bold text-demiurge-gold">{price} CGT</span>
                </div>
                <button
                  onClick={() => {
                    onPurchase?.(asset.uuid);
                    setShowPreview(false);
                  }}
                  className="w-full glass-panel py-3 rounded hover:chroma-glow transition-all font-bold text-lg"
                >
                  Complete Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
