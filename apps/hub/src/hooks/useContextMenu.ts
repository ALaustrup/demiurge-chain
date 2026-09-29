'use client';

import { useState, useCallback } from 'react';
import type { ContextMenuItem, ContextMenuPosition } from '@/components/ui/ContextMenu';

interface UseContextMenuReturn {
  isOpen: boolean;
  position: ContextMenuPosition | null;
  items: ContextMenuItem[];
  showContextMenu: (e: React.MouseEvent, menuItems: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
}

/**
 * Hook for managing context menu state
 * 
 * Usage:
 * ```tsx
 * const { isOpen, position, items, showContextMenu, hideContextMenu } = useContextMenu();
 * 
 * <div onContextMenu={(e) => showContextMenu(e, menuItems)}>
 *   Content here
 * </div>
 * 
 * <ContextMenu
 *   isOpen={isOpen}
 *   position={position}
 *   items={items}
 *   onClose={hideContextMenu}
 * />
 * ```
 */
export function useContextMenu(): UseContextMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [items, setItems] = useState<ContextMenuItem[]>([]);

  const showContextMenu = useCallback((e: React.MouseEvent, menuItems: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    
    setPosition({ x: e.clientX, y: e.clientY });
    setItems(menuItems);
    setIsOpen(true);
  }, []);

  const hideContextMenu = useCallback(() => {
    setIsOpen(false);
    // Delay clearing position/items to allow exit animation
    setTimeout(() => {
      setPosition(null);
      setItems([]);
    }, 150);
  }, []);

  return {
    isOpen,
    position,
    items,
    showContextMenu,
    hideContextMenu,
  };
}

// ============ Context Menu Item Builders ============

/**
 * Build media context menu items based on media type and state
 */
export function buildMediaContextMenuItems(options: {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  isMinted: boolean;
  nftId?: string;
  onDownload?: () => void;
  onViewOnChain?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onViewFullSize?: () => void;
  onAddToPlaylist?: () => void;
}): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  // View full size (images only)
  if (options.mediaType === 'image' && options.onViewFullSize) {
    items.push({
      id: 'view-full',
      label: 'View Full Size',
      icon: '🔍',
      onClick: options.onViewFullSize,
    });
  }

  // Add to playlist (audio only)
  if (options.mediaType === 'audio' && options.onAddToPlaylist) {
    items.push({
      id: 'add-playlist',
      label: 'Add to Playlist',
      icon: '📋',
      onClick: options.onAddToPlaylist,
    });
  }

  // Download
  if (options.onDownload) {
    items.push({
      id: 'download',
      label: 'Download',
      icon: '⬇️',
      onClick: options.onDownload,
    });
  }

  // Share
  if (options.onShare) {
    items.push({
      id: 'share',
      label: 'Share Off-Chain',
      icon: '🔗',
      onClick: options.onShare,
    });
  }

  // On-chain data (if minted)
  if (options.isMinted && options.onViewOnChain) {
    items.push({
      id: 'divider-onchain',
      label: '',
      icon: '',
      onClick: () => {},
      divider: true,
    });
    items.push({
      id: 'view-onchain',
      label: 'View On-Chain Data',
      icon: '⛓️',
      onClick: options.onViewOnChain,
    });
  }

  // Report (always last)
  if (options.onReport) {
    items.push({
      id: 'divider-report',
      label: '',
      icon: '',
      onClick: () => {},
      divider: true,
    });
    items.push({
      id: 'report',
      label: 'Report This Content',
      icon: '🚩',
      onClick: options.onReport,
      danger: true,
    });
  }

  return items;
}

export default useContextMenu;
