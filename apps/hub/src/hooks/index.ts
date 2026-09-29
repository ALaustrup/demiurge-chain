/**
 * Custom Hooks
 * 
 * Centralized exports for all custom hooks
 */

// Chain data hooks
export {
  useChainHealth,
  useChainStatus,
  useLatestBlock,
  useValidators,
  useCurrentEra,
  useBlock,
  useChainInfo,
} from './useChainData';

// Wallet data hooks
export {
  useBalance,
  useEnergy,
  useTransactionHistory,
  useUserNFTs,
  useClaimStarterBonus,
  useHasClaimedStarter,
  useTransferCGT,
  useWalletData,
} from './useWalletData';

// VYB social hooks
export {
  useVYBProfile,
  useVYBFeed,
  useVYBGallery,
  useCreatePost,
  useLikePost,
  useUpdateVYBProfile,
  useFollowUser,
  useUnfollowUser,
} from './useVYBData';

// Re-export context menu hook
export { useContextMenu, buildMediaContextMenuItems } from './useContextMenu';
