'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { getOrCreateAddressForQorId } from '@/lib/qor-wallet';

interface NFTAsset {
  id: string;
  name: string;
  thumbnail: string;
  collection?: string;
}

interface BuyOffer {
  id: string;
  assetId: string;
  assetName: string;
  offeredPrice: number;
  offerer: string;
  timestamp: Date;
}

interface NFTStats {
  totalOwned: number;
  totalValue: number;
  pendingOffers: number;
}

export function NFTSnapshotWidget() {
  const { user, isAuthenticated } = useAuth();
  const { isConnected } = useBlockchain();
  const [recentAssets, setRecentAssets] = useState<NFTAsset[]>([]);
  const [pendingOffers, setPendingOffers] = useState<BuyOffer[]>([]);
  const [stats, setStats] = useState<NFTStats>({
    totalOwned: 0,
    totalValue: 0,
    pendingOffers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNFTData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadNFTData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Get user's wallet address
      const userAddress = await getOrCreateAddressForQorId(user, false);
      
      if (!userAddress) {
        // No wallet address yet
        setRecentAssets([]);
        setPendingOffers([]);
        setStats({ totalOwned: 0, totalValue: 0, pendingOffers: 0 });
        return;
      }
      
      // Fetch real NFT data from blockchain using DRC-369 RPC
      const nfts = await demiurgeRpc.getUserNFTs(userAddress);
      
      // Transform blockchain NFT data to component format
      const assets: NFTAsset[] = nfts.map(nft => ({
        id: nft.id,
        name: nft.name,
        thumbnail: nft.image,
        collection: nft.collection,
      }));
      
      setRecentAssets(assets);
      
      // TODO: Fetch pending offers when marketplace RPC is available
      // For now, set empty offers
      setPendingOffers([]);
      
      // Calculate stats
      setStats({
        totalOwned: assets.length,
        totalValue: 0, // Would need marketplace price data
        pendingOffers: 0,
      });
      
    } catch (error) {
      console.warn('Could not load NFT data from blockchain:', error);
      // Show empty state on error
      setRecentAssets([]);
      setPendingOffers([]);
      setStats({ totalOwned: 0, totalValue: 0, pendingOffers: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-demiurge-gold/20">
        <h3 className="text-lg font-grunge text-demiurge-gold mb-4">🖼️ NFT Collection</h3>
        <p className="text-gray-400 text-sm">Login to view your NFTs</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-demiurge-gold/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-demiurge-gold/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-grunge text-demiurge-gold">🖼️ NFT Collection</h3>
          <Link href="/create" className="text-xs text-demiurge-gold hover:underline">
            DRC-369 Studio →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between mb-4 text-sm">
              <div>
                <span className="text-white font-bold">{stats.totalOwned}</span>
                <span className="text-gray-400 ml-1">Assets</span>
              </div>
              <div>
                <span className="text-demiurge-gold font-bold">{stats.totalValue.toLocaleString()}</span>
                <span className="text-gray-400 ml-1">CGT Value</span>
              </div>
            </div>

            {/* Pending Offers Alert */}
            {pendingOffers.length > 0 && (
              <Link
                href="/create#gallery"
                className="block mb-4 p-3 rounded-lg bg-demiurge-gold/10 border border-demiurge-gold/30 hover:bg-demiurge-gold/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {pendingOffers.length} Buy Offer{pendingOffers.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-400">
                        {pendingOffers[0].offeredPrice} CGT for {pendingOffers[0].assetName}
                      </div>
                    </div>
                  </div>
                  <span className="text-demiurge-gold">→</span>
                </div>
              </Link>
            )}

            {/* Asset Grid */}
            {recentAssets.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {recentAssets.slice(0, 6).map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/create#viewer`}
                    className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-demiurge-gold/20 to-demiurge-violet/20 hover:scale-105 transition-transform relative group"
                  >
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🖼️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-xs text-white truncate">{asset.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-gray-400 text-sm mb-2">No NFTs yet</p>
                <Link 
                  href="/create" 
                  className="text-demiurge-gold text-sm hover:underline"
                >
                  Mint your first NFT →
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/create"
                className="text-center py-2 bg-gradient-to-r from-demiurge-gold/20 to-demiurge-violet/20 rounded-lg border border-demiurge-gold/30 hover:border-demiurge-gold/50 transition-all text-sm font-medium text-demiurge-gold"
              >
                ⚒️ Mint
              </Link>
              <Link
                href="/marketplace"
                className="text-center py-2 glass-panel rounded-lg border border-white/10 hover:border-white/20 transition-all text-sm font-medium text-gray-300"
              >
                🏪 Market
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
