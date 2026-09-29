'use client';

import { useState, useCallback } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import { FeedCard } from './FeedCard';
import { MediaUploader, type MediaFile } from './MediaUploader';

export function Feed() {
  const { feed, isLoadingFeed, refreshFeed, createPost, uploadAndMintMedia } = useVYB();
  const [newPostText, setNewPostText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [feedType, setFeedType] = useState<'global' | 'following'>('global');
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleMediaChange = useCallback((media: MediaFile[]) => {
    setMediaFiles(media);
  }, []);

  const handleCreatePost = async () => {
    if (!newPostText.trim() && mediaFiles.length === 0) return;
    
    setIsPosting(true);
    setUploadProgress(null);
    setUploadError(null);

    try {
      // Upload media files and optionally mint as NFTs
      const uploadedMedia: string[] = [];
      
      for (let i = 0; i < mediaFiles.length; i++) {
        const media = mediaFiles[i];
        setUploadProgress(`Uploading ${i + 1}/${mediaFiles.length}: ${media.name}...`);
        
        try {
          const result = await uploadAndMintMedia(media);
          if (result.url) {
            uploadedMedia.push(result.url);
          } else {
            throw new Error(`Upload returned no URL for ${media.name}`);
          }
        } catch (uploadErr: any) {
          console.error(`Failed to upload ${media.name}:`, uploadErr);
          throw new Error(`Failed to upload ${media.name}: ${uploadErr.message || 'Unknown error'}`);
        }
        
        // If minting NFT, update progress
        if (media.mintAsNFT) {
          setUploadProgress(`Minting NFT: ${media.nftName || media.name}...`);
        }
      }

      setUploadProgress('Creating post...');

      // Create the post with uploaded media URLs
      await createPost({ 
        text: newPostText.trim() || undefined,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      });

      // Reset form
      setNewPostText('');
      setMediaFiles([]);
      setUploadProgress(null);
      setUploadError(null);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      setUploadProgress(null);
      setUploadError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const canPost = newPostText.trim() || mediaFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Post Composer */}
      <div className="glass-panel p-4 rounded-xl">
        <textarea
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="What's on your mind? Share with the VYB community..."
          className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-gray-500 font-body min-h-[100px]"
          maxLength={500}
          disabled={isPosting}
        />
        
        {/* Media Uploader */}
        <div className="pt-3 border-t border-gray-800">
          <MediaUploader 
            onMediaChange={handleMediaChange}
            disabled={isPosting}
            maxFiles={4}
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-3 px-3 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-neon-cyan border-t-transparent"></div>
              <span className="text-sm text-neon-cyan">{uploadProgress}</span>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-red-400">{uploadError}</span>
              <button 
                onClick={() => setUploadError(null)}
                className="text-red-400 hover:text-red-300 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Post Button */}
        <div className="flex items-center justify-end pt-3 mt-3 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{newPostText.length}/500</span>
            <button
              onClick={handleCreatePost}
              disabled={!canPost || isPosting}
              className="neon-button px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Feed Type Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setFeedType('global')}
          className={`font-grunge-alt text-lg transition-colors ${
            feedType === 'global' ? 'text-neon-cyan' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          🌐 Global
        </button>
        <button
          onClick={() => setFeedType('following')}
          className={`font-grunge-alt text-lg transition-colors ${
            feedType === 'following' ? 'text-neon-cyan' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          👥 Following
        </button>
        <div className="flex-1" />
        <button
          onClick={() => refreshFeed()}
          className="text-gray-500 hover:text-neon-cyan transition-colors"
          title="Refresh feed"
        >
          🔄
        </button>
      </div>

      {/* Feed Items */}
      {isLoadingFeed ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feed...</p>
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-xl">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-400">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
