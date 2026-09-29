'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { vybService } from '@/lib/vyb/service';
import type {
  VYBProfile,
  FeedItem,
  Conversation,
  Notification,
  GalleryItem,
  ProfileTheme,
} from '@/lib/vyb/types';
import type { MediaFile } from '@/components/vyb/MediaUploader';

interface VYBContextType {
  // Profile
  profile: VYBProfile | null;
  isLoadingProfile: boolean;
  updateProfile: (updates: Partial<VYBProfile>) => Promise<void>;
  updateTheme: (theme: Partial<ProfileTheme>) => Promise<void>;

  // Feed
  feed: FeedItem[];
  isLoadingFeed: boolean;
  refreshFeed: () => Promise<void>;
  createPost: (content: { text?: string; media?: string[] }) => Promise<FeedItem>;
  likePost: (postId: string) => Promise<void>;
  tipPost: (postId: string, amount: number) => Promise<void>;

  // Conversations
  conversations: Conversation[];
  unreadMessageCount: number;
  refreshConversations: () => Promise<void>;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Gallery
  gallery: GalleryItem[];
  isLoadingGallery: boolean;
  refreshGallery: () => Promise<void>;
  uploadMedia: (file: File) => Promise<GalleryItem>;
  mintMedia: (mediaId: string, options: { name: string; description: string; royaltyPercent: number }) => Promise<{ success: boolean; nftId?: string }>;

  // Media upload with optional NFT minting
  uploadAndMintMedia: (media: MediaFile) => Promise<{ url: string; nftId?: string }>;
}

const VYBContext = createContext<VYBContextType | undefined>(undefined);

export function VYBProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState<VYBProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Feed state
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Gallery state
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Computed values
  const unreadMessageCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // Load profile when user changes
  useEffect(() => {
    if (isAuthenticated && user?.qor_id) {
      vybService.setCurrentUser(user.qor_id);
      loadProfile(user.qor_id);
      loadFeed();
      loadConversations();
      loadNotifications();
      loadGallery(user.qor_id);
    } else {
      setProfile(null);
      setFeed([]);
      setConversations([]);
      setNotifications([]);
      setGallery([]);
    }
  }, [isAuthenticated, user?.qor_id]);

  const loadProfile = async (qorId: string) => {
    setIsLoadingProfile(true);
    try {
      const data = await vybService.getProfile(qorId);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const data = await vybService.getFeed({ type: 'global', limit: 20 });
      setFeed(data);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await vybService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await vybService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadGallery = async (qorId: string) => {
    setIsLoadingGallery(true);
    try {
      const data = await vybService.getGallery(qorId);
      setGallery(data);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  // Profile methods
  const updateProfile = useCallback(async (updates: Partial<VYBProfile>) => {
    if (!user?.qor_id) return;
    const updated = await vybService.updateProfile(user.qor_id, updates);
    setProfile(updated);
  }, [user?.qor_id]);

  const updateTheme = useCallback(async (theme: Partial<ProfileTheme>) => {
    if (!user?.qor_id) return;
    await vybService.updateTheme(user.qor_id, theme);
    if (profile) {
      setProfile({ ...profile, theme: { ...profile.theme, ...theme } });
    }
  }, [user?.qor_id, profile]);

  // Feed methods
  const refreshFeed = useCallback(async () => {
    await loadFeed();
  }, []);

  const createPost = useCallback(async (content: { text?: string; media?: string[] }) => {
    const post = await vybService.createPost(content);
    setFeed(prev => [post, ...prev]);
    return post;
  }, []);

  const likePost = useCallback(async (postId: string) => {
    await vybService.likePost(postId);
    setFeed(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isLiked: !p.isLiked, likes: p.likes + (p.isLiked ? -1 : 1) };
      }
      return p;
    }));
  }, []);

  const tipPost = useCallback(async (postId: string, amount: number) => {
    await vybService.tipPost(postId, amount);
    setFeed(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isTipped: true, tips: p.tips + 1, tipsAmount: p.tipsAmount + amount };
      }
      return p;
    }));
  }, []);

  // Conversation methods
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, []);

  // Notification methods
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await vybService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await vybService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Gallery methods
  const refreshGallery = useCallback(async () => {
    if (user?.qor_id) {
      await loadGallery(user.qor_id);
    }
  }, [user?.qor_id]);

  const uploadMedia = useCallback(async (file: File) => {
    const item = await vybService.uploadMedia(file);
    setGallery(prev => [item, ...prev]);
    return item;
  }, []);

  const mintMedia = useCallback(async (mediaId: string, options: { name: string; description: string; royaltyPercent: number }) => {
    const result = await vybService.mintMedia(mediaId, options);
    if (result.success && result.nftId) {
      setGallery(prev => prev.map(item => 
        item.id === mediaId ? { ...item, isMinted: true, nftId: result.nftId } : item
      ));
    }
    return result;
  }, []);

  // Upload media and optionally mint as NFT
  const uploadAndMintMedia = useCallback(async (media: MediaFile): Promise<{ url: string; nftId?: string }> => {
    try {
      console.log('[VYB] Starting upload for:', media.name, 'Type:', media.type);
      
      // Upload the main media file
      const uploadResult = await vybService.uploadMediaToIPFS(media.file, media.albumArtwork);
      
      console.log('[VYB] Upload result:', uploadResult);
      
      if (!uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }
      
      let nftId: string | undefined;

      // If user opted to mint as NFT
      if (media.mintAsNFT && uploadResult.url) {
        console.log('[VYB] Minting NFT for:', media.nftName || media.name);
        
        const mintResult = await vybService.mintMediaAsNFT({
          mediaUrl: uploadResult.url,
          artworkUrl: uploadResult.artworkUrl,
          name: media.nftName || media.name,
          description: media.nftDescription || '',
          royaltyPercent: media.nftRoyalty || 5,
          mediaType: media.type,
        });

        console.log('[VYB] Mint result:', mintResult);

        if (mintResult.success) {
          nftId = mintResult.nftId;
        } else {
          // Log but don't fail the whole upload if minting fails
          console.warn('[VYB] NFT minting failed, but upload succeeded');
        }
      }

      // Add to gallery
      if (uploadResult.galleryItem) {
        setGallery(prev => [uploadResult.galleryItem!, ...prev]);
      }

      return { url: uploadResult.url, nftId };
    } catch (error: any) {
      console.error('[VYB] uploadAndMintMedia failed:', error);
      throw new Error(error.message || 'Media upload failed');
    }
  }, []);

  const value: VYBContextType = {
    profile,
    isLoadingProfile,
    updateProfile,
    updateTheme,
    feed,
    isLoadingFeed,
    refreshFeed,
    createPost,
    likePost,
    tipPost,
    conversations,
    unreadMessageCount,
    refreshConversations,
    notifications,
    unreadNotificationCount,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    gallery,
    isLoadingGallery,
    refreshGallery,
    uploadMedia,
    mintMedia,
    uploadAndMintMedia,
  };

  return (
    <VYBContext.Provider value={value}>
      {children}
    </VYBContext.Provider>
  );
}

export function useVYB() {
  const context = useContext(VYBContext);
  if (context === undefined) {
    throw new Error('useVYB must be used within a VYBProvider');
  }
  return context;
}
