'use client';

import { useState, useEffect } from 'react';
import { MarketplaceListing } from '@/components/marketplace/MarketplaceListing';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { useToast } from '@/components/notifications';
import type { Drc369Asset } from '@demiurge/qor-sdk';

export default function MarketplacePage() {
  const toast = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'virtual' | 'real-world' | 'hybrid'>('all');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const marketListings = await demiurgeRpc.getMarketplaceListings();
      if (marketListings && marketListings.length > 0) {
        setListings(marketListings.map((l: any) => ({
          asset: {
            uuid: l.assetId,
            name: l.name,
            creatorQorId: l.creatorId,
            assetType: l.assetType || 'virtual',
            xpLevel: l.xpLevel || 0,
            metadata: {
              description: l.description,
              image: l.image,
              attributes: l.attributes || {},
            },
            isSoulbound: l.isSoulbound || false,
            owner: l.sellerId,
            mintedAt: l.mintedAt,
          },
          sellerLevel: l.sellerLevel || 1,
          sellerQorId: l.sellerId,
          price: l.price,
        })));
      } else {
        setListings([]);
      }
    } catch (error) {
      console.warn('Could not load marketplace listings:', error);
      setListings([]);
      toast.error('Failed to load marketplace', 'Check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (assetUuid: string) => {
    const listing = listings.find(l => l.asset.uuid === assetUuid);
    if (!listing) {
      toast.error('Listing not found');
      return;
    }

    try {
      toast.info('Processing purchase...');
      
      // Call the marketplace purchase API which handles CGT transfer + NFT ownership transfer
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetUuid,
          listingId: listing.id,
          price: listing.price,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error('Purchase failed', result.error || 'Transaction was rejected');
        return;
      }

      toast.success('Purchase complete!', `txHash: ${result.txHash?.slice(0, 16)}...`);
      loadListings(); // Refresh listings
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed', 'Could not complete the transaction');
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (filter === 'all') return true;
    return listing.asset.assetType === filter;
  });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-xl text-gray-300 mt-2">
              Trade District - Buy and sell DRC-369 assets
            </p>
          </div>
          <button
            onClick={loadListings}
            disabled={loading}
            className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          {(['all', 'virtual', 'real-world', 'hybrid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`glass-panel px-6 py-2 rounded-lg transition-all ${
                filter === f
                  ? 'chroma-glow border border-demiurge-cyan'
                  : 'hover:chroma-glow'
              }`}
            >
              {f === 'all' ? 'All Assets' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-12">
            <div className="flex items-center justify-center mb-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-demiurge-cyan" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="glass-panel rounded-xl overflow-hidden">
                  <div className="aspect-square bg-white/5 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Listings Found</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              {filter === 'all' 
                ? 'The marketplace is empty. Be the first to list an NFT!'
                : `No ${filter} assets are currently listed. Try a different filter.`
              }
            </p>
            <button
              onClick={loadListings}
              className="glass-panel px-6 py-3 rounded-lg text-demiurge-cyan hover:chroma-glow transition-all"
            >
              Refresh Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <MarketplaceListing
                key={listing.asset.uuid}
                asset={listing.asset}
                sellerLevel={listing.sellerLevel}
                sellerQorId={listing.sellerQorId}
                price={listing.price}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
