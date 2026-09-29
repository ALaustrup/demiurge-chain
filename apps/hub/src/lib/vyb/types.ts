/**
 * VYB Social Platform Types
 * Core data structures for the on-chain social network
 */

// ============ User Profile Types ============

export interface VYBProfile {
  qorId: string;
  walletAddress: string;
  displayName: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  role: UserRole;
  badges: Badge[];
  stats: ProfileStats;
  theme: ProfileTheme;
  createdAt: Date;
  lastActive: Date;
  isVerified: boolean;
  socialLinks: SocialLinks;
}

export type UserRole = 
  | 'creator'
  | 'developer' 
  | 'artist'
  | 'musician'
  | 'designer'
  | 'gamer'
  | 'collector'
  | 'user';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  earnedAt: Date;
  description: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
  posts: number;
  nftsOwned: number;
  nftsCreated: number;
  cgtEarned: number;
  gamesPlayed: number;
  achievementsUnlocked: number;
}

export interface ProfileTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontStyle: 'modern' | 'retro' | 'grunge' | 'minimal';
  layoutStyle: 'classic' | 'grid' | 'timeline' | 'gallery';
  musicEnabled: boolean;
  profileSong?: string;
  bannerImage?: string;
  musicFile?: string;
  musicPlayerStyle?: 'minimal' | 'full' | 'compact';
  musicPlayerColor?: string;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  discord?: string;
  github?: string;
  youtube?: string;
  twitch?: string;
}

// ============ Activity Feed Types ============

export interface FeedItem {
  id: string;
  type: FeedItemType;
  author: FeedAuthor;
  content: FeedContent;
  timestamp: Date;
  likes: number;
  comments: number;
  tips: number;
  tipsAmount: number; // CGT
  isLiked: boolean;
  isTipped: boolean;
  visibility: 'public' | 'followers' | 'private';
  txHash?: string; // On-chain transaction if applicable
}

export type FeedItemType =
  | 'post'
  | 'achievement'
  | 'nft_mint'
  | 'nft_purchase'
  | 'game_score'
  | 'level_up'
  | 'reward'
  | 'follow'
  | 'tip'
  | 'service_complete';

export interface FeedAuthor {
  qorId: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
  role: UserRole;
  // Donor status for VYB chat privileges
  donorTier?: number;
  chatPrivileges?: string[];
}

export interface FeedContent {
  text?: string;
  media?: MediaItem[];
  nft?: NFTPreview;
  achievement?: AchievementPreview;
  game?: GamePreview;
  reward?: RewardPreview;
  mention?: string[]; // QOR IDs mentioned
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // For video/audio
  isMinted: boolean;
  nftId?: string;
  expiresAt?: Date; // 3 months from upload
}

export interface NFTPreview {
  id: string;
  name: string;
  image: string;
  collection?: string;
  price?: number;
}

export interface AchievementPreview {
  id: string;
  name: string;
  icon: string;
  tier: string;
  game?: string;
}

export interface GamePreview {
  id: string;
  name: string;
  thumbnail: string;
  score?: number;
  leaderboardRank?: number;
}

export interface RewardPreview {
  amount: number;
  reason: string;
  source: 'game' | 'staking' | 'referral' | 'achievement' | 'tip';
}

// ============ Messaging Types ============

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  qorId: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  // Donor status for VYB chat privileges
  donorTier?: number;
  chatPrivileges?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string; // QOR ID
  content: MessageContent;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string; // Message ID
  reactions: MessageReaction[];
}

export interface MessageContent {
  text?: string;
  media?: MediaItem[];
  nft?: NFTPreview;
  tip?: {
    amount: number;
    message?: string;
  };
  sharedPost?: string; // Feed item ID
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // QOR IDs
}

// ============ Media Gallery Types ============

export interface GalleryItem {
  id: string;
  ownerId: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  tags: string[];
  uploadedAt: Date;
  expiresAt: Date; // 3 months from upload
  isMinted: boolean;
  nftId?: string;
  isPublic: boolean;
  views: number;
  likes: number;
}

export interface MintRequest {
  mediaId: string;
  name: string;
  description: string;
  royaltyPercent: number;
  isPublic: boolean;
  collection?: string;
}

// ============ Service Marketplace Types ============

export interface ServiceListing {
  id: string;
  creatorId: string;
  creator: FeedAuthor;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number; // CGT
  deliveryDays: number;
  rating: number;
  reviewCount: number;
  portfolio: MediaItem[];
  tags: string[];
  isActive: boolean;
}

export type ServiceCategory =
  | 'game-design'
  | 'web-design'
  | 'graphics'
  | 'music'
  | 'art'
  | 'animation'
  | '3d-modeling'
  | 'smart-contracts'
  | 'consulting'
  | 'other';

export interface ServiceOrder {
  id: string;
  serviceId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
  requirements: string;
  deliverables?: MediaItem[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============ Notification Types ============

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export type NotificationType =
  | 'message'
  | 'follow'
  | 'like'
  | 'comment'
  | 'tip'
  | 'mention'
  | 'achievement'
  | 'reward'
  | 'nft_sold'
  | 'order_update'
  | 'system';

// ============ Music Artist Types ============

export interface MusicArtistProfile {
  id: string;
  userId: string;
  qorId: string;
  artistName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  primaryGenre: string;
  genres: string[];
  socialLinks: MusicArtistSocialLinks;
  isVerified: boolean;
  verifiedAt?: Date;
  artistBadgeId?: string;  // DRC-369 NFT ID
  releaseCount: number;
  totalPlays: number;
  totalCollectors: number;
  followers: number;
  following: number;
  termsAcceptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MusicArtistSocialLinks {
  soundcloud?: string;
  spotify?: string;
  appleMusic?: string;
  bandcamp?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export type ReleaseType = 'single' | 'ep' | 'album';

export interface MusicRelease {
  id: string;
  artistId: string;
  artist: MusicArtistProfile;
  title: string;
  releaseType: ReleaseType;
  coverArt: string;  // IPFS URI
  coverArtThumbnail?: string;
  tracks: MusicReleaseTrack[];
  genre: string;
  subGenres?: string[];
  releaseDate: Date;
  description?: string;
  credits?: string;
  upc?: string;  // Optional UPC code
  
  // DRC-369 specific
  nftId: string;
  metadataUri: string;  // IPFS URI
  mintedAt: Date;
  mintCost: number;  // 20/50/75 CGT
  royaltyBps: number;  // Artist royalty on secondary sales (basis points)
  
  // Stats
  totalPlays: number;
  totalCollectors: number;
  likes: number;
  
  // Flags
  isFeatured: boolean;
  isExplicit: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MusicReleaseTrack {
  id: string;
  releaseId: string;
  trackNumber: number;
  title: string;
  duration: number;  // Duration in seconds
  audioUri: string;  // IPFS URI
  previewUri?: string;  // 30-second preview
  isrc?: string;  // International Standard Recording Code
  lyrics?: string;
  credits?: string;
  isExplicit: boolean;
  plays: number;
}

// Release pricing constants
export const RELEASE_PRICING = {
  single: { minTracks: 1, maxTracks: 3, cost: 20 },
  ep: { minTracks: 4, maxTracks: 7, cost: 50 },
  album: { minTracks: 8, maxTracks: 50, cost: 75 },
} as const;

// Helper to determine release type from track count
export function getReleaseType(trackCount: number): ReleaseType {
  if (trackCount <= 3) return 'single';
  if (trackCount <= 7) return 'ep';
  return 'album';
}

// Helper to get release cost
export function getReleaseCost(releaseType: ReleaseType): number {
  return RELEASE_PRICING[releaseType].cost;
}
