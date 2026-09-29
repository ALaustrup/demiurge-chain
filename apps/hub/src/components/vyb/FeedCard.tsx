'use client';

import { useState, useCallback } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import { useGlobalContextMenu } from '@/contexts/ContextMenuContext';
import { buildMediaContextMenuItems } from '@/hooks/useContextMenu';
import type { FeedItem, MediaItem } from '@/lib/vyb/types';
import { DonorUsername } from './DonorUsername';
import { AudioPlayer } from './AudioPlayer';

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const { likePost, tipPost } = useVYB();
  const { showContextMenu } = useGlobalContextMenu();
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');

  // Build and show context menu for media
  const handleMediaContextMenu = useCallback((e: React.MouseEvent, media: MediaItem) => {
    const menuItems = buildMediaContextMenuItems({
      mediaUrl: media.url,
      mediaType: media.type,
      isMinted: media.isMinted,
      nftId: media.nftId,
      onDownload: () => {
        // Open media in new tab for download
        window.open(media.url, '_blank');
      },
      onViewOnChain: media.isMinted ? () => {
        // Navigate to on-chain data
        window.open(`/explorer/nft/${media.nftId}`, '_blank');
      } : undefined,
      onShare: () => {
        // Copy URL to clipboard
        navigator.clipboard.writeText(media.url);
        // TODO: Show toast notification
      },
      onReport: () => {
        // TODO: Implement report modal
        console.log('Report media:', media.id);
      },
      onViewFullSize: media.type === 'image' ? () => {
        window.open(media.url, '_blank');
      } : undefined,
    });

    showContextMenu(e, menuItems);
  }, [showContextMenu]);

  const handleTip = async () => {
    const amount = parseFloat(tipAmount);
    if (amount > 0) {
      await tipPost(item.id, amount);
      setShowTipModal(false);
      setTipAmount('');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return '🎨';
      case 'musician': return '🎵';
      case 'developer': return '💻';
      case 'designer': return '✨';
      case 'gamer': return '🎮';
      case 'creator': return '🎬';
      default: return '👤';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'nft_mint': return '🖼️';
      case 'game_score': return '🎮';
      case 'reward': return '💰';
      case 'level_up': return '⬆️';
      default: return '💬';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="glass-panel p-4 rounded-xl hover:border-neon-cyan/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xl flex-shrink-0">
          {getRoleIcon(item.author.role)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <DonorUsername
              displayName={item.author.displayName}
              qorId={item.author.qorId}
              donorTier={item.author.donorTier}
              chatPrivileges={item.author.chatPrivileges}
              className="text-neon-cyan hover:text-neon-cyan/80 cursor-pointer"
            />
            {item.author.isVerified && (
              <span className="text-blue-400 text-sm" title="Verified">✓</span>
            )}
            <span className="text-gray-500 text-sm">@{item.author.qorId}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatTime(item.timestamp)}</span>
            {item.type !== 'post' && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {getTypeIcon(item.type)} {item.type.replace('_', ' ')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {item.content.text && (
          <p className="text-white font-body leading-relaxed whitespace-pre-wrap">
            {item.content.text}
          </p>
        )}

        {/* Achievement */}
        {item.content.achievement && (
          <div className="mt-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{item.content.achievement.icon}</span>
              <div>
                <p className="font-grunge-alt text-yellow-400">{item.content.achievement.name}</p>
                <p className="text-xs text-gray-400 capitalize">{item.content.achievement.tier} tier</p>
              </div>
            </div>
          </div>
        )}

        {/* NFT */}
        {item.content.nft && (
          <div className="mt-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                🖼️
              </div>
              <div>
                <p className="font-grunge-alt text-purple-400">{item.content.nft.name}</p>
                <p className="text-xs text-gray-400">New NFT Minted</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Score */}
        {item.content.game && (
          <div className="mt-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎮</span>
                <div>
                  <p className="font-grunge-alt text-blue-400">{item.content.game.name}</p>
                  {item.content.game.leaderboardRank && (
                    <p className="text-xs text-gray-400">Rank #{item.content.game.leaderboardRank}</p>
                  )}
                </div>
              </div>
              {item.content.game.score && (
                <div className="text-right">
                  <p className="text-2xl font-grunge text-cyan-400">{item.content.game.score.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reward */}
        {item.content.reward && (
          <div className="mt-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{item.content.reward.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-grunge text-green-400">+{item.content.reward.amount} CGT</p>
              </div>
            </div>
          </div>
        )}

        {/* Media */}
        {item.content.media && item.content.media.length > 0 && (
          <div className="mt-3 space-y-2">
            {/* Images and Videos Grid */}
            {item.content.media.filter(m => m.type === 'image' || m.type === 'video').length > 0 && (
              <div className="grid gap-2" style={{
                gridTemplateColumns: item.content.media.filter(m => m.type !== 'audio').length === 1 ? '1fr' : 'repeat(2, 1fr)'
              }}>
                {item.content.media.filter(m => m.type === 'image' || m.type === 'video').map((media) => (
                  <div 
                    key={media.id} 
                    className="relative rounded-lg overflow-hidden bg-blockchain-light aspect-video cursor-pointer"
                    onContextMenu={(e) => handleMediaContextMenu(e, media)}
                  >
                    {media.type === 'image' && (
                      <img 
                        src={media.url} 
                        alt="" 
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    )}
                    {media.type === 'video' && (
                      <video 
                        src={media.url}
                        controls
                        poster={media.thumbnailUrl}
                        className="w-full h-full object-contain bg-black"
                        preload="metadata"
                        onContextMenu={(e) => handleMediaContextMenu(e, media)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {media.isMinted && (
                      <div className="absolute top-2 right-2 bg-purple-500/80 px-2 py-1 rounded text-xs z-10">
                        NFT
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Audio Players */}
            {item.content.media.filter(m => m.type === 'audio').map((media) => (
              <AudioPlayer
                key={media.id}
                src={media.url}
                artworkUrl={media.thumbnailUrl}
                isMinted={media.isMinted}
                onContextMenu={(e) => handleMediaContextMenu(e, media)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button 
            onClick={() => likePost(item.id)}
            className={`flex items-center gap-1 text-sm transition-colors ${
              item.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'
            }`}
          >
            <span>{item.isLiked ? '❤️' : '🤍'}</span>
            <span>{item.likes}</span>
          </button>

          {/* Comment */}
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-400 transition-colors">
            <span>💬</span>
            <span>{item.comments}</span>
          </button>

          {/* Tip */}
          <button 
            onClick={() => setShowTipModal(true)}
            className={`flex items-center gap-1 text-sm transition-colors ${
              item.isTipped ? 'text-green-500' : 'text-gray-500 hover:text-green-400'
            }`}
          >
            <span>💰</span>
            <span>{item.tips > 0 ? `${item.tipsAmount} CGT` : 'Tip'}</span>
          </button>
        </div>

        {/* Share */}
        <button className="text-gray-500 hover:text-neon-cyan transition-colors">
          <span>🔗</span>
        </button>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel liquid-border p-6 rounded-xl w-80">
            <h3 className="font-grunge-alt text-neon-cyan text-xl mb-4">
              Send CGT Tip
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tip{' '}
              <DonorUsername
                displayName={item.author.displayName}
                donorTier={item.author.donorTier}
                chatPrivileges={item.author.chatPrivileges}
                className="text-neon-purple"
                showBadge={false}
              />
            </p>
            <div className="mb-4">
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="Amount in CGT"
                min="0.01"
                step="0.01"
                className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="flex-1 neon-button py-2 rounded-lg disabled:opacity-50"
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
