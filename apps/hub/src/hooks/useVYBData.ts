'use client';

/**
 * VYB Data Hooks
 * 
 * React Query hooks for VYB social platform data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateFeed } from '@/lib/query-client';
import { vybService } from '@/lib/vyb/service';
import type { FeedItem, VYBProfile, GalleryItem } from '@/lib/vyb/types';
import { toast } from '@/providers/ToastProvider';

/**
 * Hook for VYB profile
 */
export function useVYBProfile(qorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vyb.profile(qorId!),
    queryFn: () => vybService.getProfile(qorId!),
    enabled: !!qorId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for VYB feed
 */
export function useVYBFeed(type: 'global' | 'following' = 'global') {
  return useQuery({
    queryKey: queryKeys.vyb.feed(type),
    queryFn: () => vybService.getFeed({ type }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Poll every minute
  });
}

/**
 * Hook for user gallery
 */
export function useVYBGallery(qorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vyb.gallery(qorId!),
    queryFn: () => vybService.getGallery(qorId!),
    enabled: !!qorId,
    staleTime: 60000,
  });
}

/**
 * Hook for creating a post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { text?: string; media?: string[] }) => vybService.createPost(data),
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.vyb.feed('global') });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData<FeedItem[]>(queryKeys.vyb.feed('global'));

      // Optimistically add the new post
      if (previousFeed && newPost.text) {
        const optimisticPost: FeedItem = {
          id: `temp_${Date.now()}`,
          type: 'post',
          author: {
            qorId: vybService.getCurrentUser() || 'unknown',
            displayName: 'You',
            isVerified: false,
            role: 'user',
          },
          content: {
            text: newPost.text,
            media: newPost.media?.map((url, i) => ({
              id: `temp_media_${i}`,
              type: 'image' as const,
              url,
              isMinted: false,
            })),
          },
          timestamp: new Date(),
          likes: 0,
          comments: 0,
          tips: 0,
          tipsAmount: 0,
          isLiked: false,
          isTipped: false,
          visibility: 'public',
        };

        queryClient.setQueryData<FeedItem[]>(
          queryKeys.vyb.feed('global'),
          [optimisticPost, ...previousFeed]
        );
      }

      return { previousFeed };
    },
    onError: (err, newPost, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(queryKeys.vyb.feed('global'), context.previousFeed);
      }
    },
    onSuccess: () => {
      toast.success('Post created!');
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      invalidateFeed();
    },
    meta: { showErrorToast: true },
  });
}

/**
 * Hook for liking a post
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => vybService.likePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.vyb.feed('global') });

      // Snapshot and optimistically update
      const previousFeed = queryClient.getQueryData<FeedItem[]>(queryKeys.vyb.feed('global'));

      if (previousFeed) {
        queryClient.setQueryData<FeedItem[]>(
          queryKeys.vyb.feed('global'),
          previousFeed.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                }
              : post
          )
        );
      }

      return { previousFeed };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(queryKeys.vyb.feed('global'), context.previousFeed);
      }
    },
    meta: { showErrorToast: false }, // Silent failures for likes
  });
}

/**
 * Hook for updating VYB profile
 */
export function useUpdateVYBProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<VYBProfile>) => {
      const qorId = vybService.getCurrentUser();
      if (!qorId) throw new Error('Not logged in');
      return vybService.updateProfile(qorId, data);
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      // Invalidate the profile query
      const qorId = vybService.getCurrentUser();
      if (qorId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.vyb.profile(qorId) });
      }
    },
    meta: { showErrorToast: true },
  });
}

/**
 * Hook for following a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qorId: string) => vybService.followUser(qorId),
    onSuccess: (_, qorId) => {
      toast.success(`Following @${qorId.split('#')[0]}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.vyb.profile(qorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vyb.feed('following') });
    },
    meta: { showErrorToast: true },
  });
}

/**
 * Hook for unfollowing a user
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qorId: string) => vybService.unfollowUser(qorId),
    onSuccess: (_, qorId) => {
      toast.info(`Unfollowed @${qorId.split('#')[0]}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.vyb.profile(qorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vyb.feed('following') });
    },
    meta: { showErrorToast: true },
  });
}
