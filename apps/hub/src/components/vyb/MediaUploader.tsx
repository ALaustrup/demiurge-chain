'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============ Types ============

export interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio';
  previewUrl: string;
  name: string;
  size: number;
  // For audio files
  albumArtwork?: File;
  albumArtworkPreview?: string;
  // NFT minting options
  mintAsNFT: boolean;
  nftName?: string;
  nftDescription?: string;
  nftRoyalty?: number;
}

interface MediaUploaderProps {
  onMediaChange: (media: MediaFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

// ============ Constants ============

const MAX_FILE_SIZE_MB = 1500; // 1.5 GB max for music/video files
const ALBUM_ART_SIZE = 3000; // 3000x3000 pixels
const ACCEPTED_TYPES = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
};

// ============ Component ============

export function MediaUploader({ 
  onMediaChange, 
  maxFiles = 4,
  maxSizeMB = MAX_FILE_SIZE_MB,
  disabled = false 
}: MediaUploaderProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showArtworkModal, setShowArtworkModal] = useState(false);
  const [pendingAudioFile, setPendingAudioFile] = useState<MediaFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  // Determine media type from MIME type
  const getMediaType = (mimeType: string): 'image' | 'video' | 'audio' => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'image';
  };

  // Validate file size
  const validateFile = (file: File): string | null => {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File "${file.name}" is too large (${sizeMB.toFixed(1)}MB). Max size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  // Create preview URL based on type
  const createPreview = (file: File, type: 'image' | 'video' | 'audio'): string => {
    if (type === 'image' || type === 'video') {
      return URL.createObjectURL(file);
    }
    // For audio, return empty - will use default or album art
    return '';
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    if (mediaFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed per post.`);
      return;
    }

    const newMediaFiles: MediaFile[] = [];

    for (const file of files) {
      // Validate size
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const type = getMediaType(file.type);
      const mediaFile: MediaFile = {
        id: `media_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        type,
        previewUrl: createPreview(file, type),
        name: file.name,
        size: file.size,
        mintAsNFT: false,
        nftName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        nftRoyalty: 5,
      };

      // If audio, prompt for album artwork
      if (type === 'audio') {
        setPendingAudioFile(mediaFile);
        setShowArtworkModal(true);
        return; // Wait for artwork selection
      }

      newMediaFiles.push(mediaFile);
    }

    const updated = [...mediaFiles, ...newMediaFiles];
    setMediaFiles(updated);
    onMediaChange(updated);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [mediaFiles, maxFiles, maxSizeMB, onMediaChange]);

  // Resize image to 3000x3000
  const resizeImage = async (file: File, targetSize: number): Promise<{ file: File; previewUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Fill with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Calculate scaling to fit image centered
        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        const x = (targetSize - img.width * scale) / 2;
        const y = (targetSize - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const resizedFile = new File([blob], `artwork_${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve({
            file: resizedFile,
            previewUrl: URL.createObjectURL(resizedFile),
          });
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle album artwork selection
  const handleArtworkSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!pendingAudioFile) return;

    let updatedAudioFile = { ...pendingAudioFile };

    if (file) {
      try {
        // Resize to 3000x3000
        const resized = await resizeImage(file, ALBUM_ART_SIZE);
        updatedAudioFile = {
          ...updatedAudioFile,
          albumArtwork: resized.file,
          albumArtworkPreview: resized.previewUrl,
        };
      } catch (err) {
        console.error('Failed to resize artwork:', err);
        setError('Failed to process album artwork. Using default.');
      }
    }

    const updated = [...mediaFiles, updatedAudioFile];
    setMediaFiles(updated);
    onMediaChange(updated);
    
    setShowArtworkModal(false);
    setPendingAudioFile(null);

    // Reset inputs
    if (artworkInputRef.current) artworkInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [pendingAudioFile, mediaFiles, onMediaChange]);

  // Skip artwork and add audio with default
  const handleSkipArtwork = useCallback(() => {
    if (pendingAudioFile) {
      const updated = [...mediaFiles, pendingAudioFile];
      setMediaFiles(updated);
      onMediaChange(updated);
    }
    setShowArtworkModal(false);
    setPendingAudioFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [pendingAudioFile, mediaFiles, onMediaChange]);

  // Remove media file
  const handleRemove = useCallback((id: string) => {
    const updated = mediaFiles.filter(m => m.id !== id);
    // Revoke object URLs to prevent memory leaks
    const removed = mediaFiles.find(m => m.id === id);
    if (removed) {
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      if (removed.albumArtworkPreview) URL.revokeObjectURL(removed.albumArtworkPreview);
    }
    setMediaFiles(updated);
    onMediaChange(updated);
  }, [mediaFiles, onMediaChange]);

  // Toggle NFT minting for a media item
  const toggleMintNFT = useCallback((id: string) => {
    const updated = mediaFiles.map(m => 
      m.id === id ? { ...m, mintAsNFT: !m.mintAsNFT } : m
    );
    setMediaFiles(updated);
    onMediaChange(updated);
  }, [mediaFiles, onMediaChange]);

  // Update NFT metadata
  const updateNFTMetadata = useCallback((id: string, field: 'nftName' | 'nftDescription' | 'nftRoyalty', value: string | number) => {
    const updated = mediaFiles.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    );
    setMediaFiles(updated);
    onMediaChange(updated);
  }, [mediaFiles, onMediaChange]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get type icon
  const getTypeIcon = (type: 'image' | 'video' | 'audio'): string => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '🎵';
      default: return '🖼️';
    }
  };

  return (
    <div className="space-y-3">
      {/* Media Buttons */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={`${ACCEPTED_TYPES.image},${ACCEPTED_TYPES.video},${ACCEPTED_TYPES.audio}`}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || mediaFiles.length >= maxFiles}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || mediaFiles.length >= maxFiles}
          className="text-gray-500 hover:text-neon-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add image"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || mediaFiles.length >= maxFiles}
          className="text-gray-500 hover:text-neon-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add video"
        >
          🎥
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || mediaFiles.length >= maxFiles}
          className="text-gray-500 hover:text-neon-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add audio"
        >
          🎵
        </button>
        
        {mediaFiles.length > 0 && (
          <span className="text-xs text-gray-500">
            {mediaFiles.length}/{maxFiles} files
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Media Preview Grid */}
      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {mediaFiles.map((media) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group rounded-xl overflow-hidden border border-gray-700 bg-blockchain-light"
              >
                {/* Preview */}
                <div className="aspect-video relative">
                  {media.type === 'image' && (
                    <img 
                      src={media.previewUrl} 
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {media.type === 'video' && (
                    <video 
                      src={media.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  {media.type === 'audio' && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20">
                      {media.albumArtworkPreview ? (
                        <img 
                          src={media.albumArtworkPreview} 
                          alt="Album artwork"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">🎵</span>
                      )}
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <span>{getTypeIcon(media.type)}</span>
                    <span className="text-gray-300">{formatSize(media.size)}</span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(media.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 
                      flex items-center justify-center text-white text-sm
                      opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>

                  {/* NFT Badge */}
                  {media.mintAsNFT && (
                    <div className="absolute bottom-2 left-2 bg-purple-500/80 px-2 py-1 rounded text-xs text-white">
                      NFT
                    </div>
                  )}
                </div>

                {/* Media Info & NFT Toggle */}
                <div className="p-3 space-y-2">
                  <p className="text-sm text-gray-300 truncate">{media.name}</p>
                  
                  {/* Mint as NFT Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={media.mintAsNFT}
                      onChange={() => toggleMintNFT(media.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-neon-cyan focus:ring-neon-cyan"
                    />
                    <span className="text-xs text-gray-400">Mint as NFT</span>
                  </label>

                  {/* NFT Metadata (when minting enabled) */}
                  {media.mintAsNFT && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-2 border-t border-gray-700"
                    >
                      <input
                        type="text"
                        value={media.nftName || ''}
                        onChange={(e) => updateNFTMetadata(media.id, 'nftName', e.target.value)}
                        placeholder="NFT Name"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
                      />
                      <input
                        type="text"
                        value={media.nftDescription || ''}
                        onChange={(e) => updateNFTMetadata(media.id, 'nftDescription', e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Royalty:</span>
                        <input
                          type="number"
                          value={media.nftRoyalty || 5}
                          onChange={(e) => updateNFTMetadata(media.id, 'nftRoyalty', parseInt(e.target.value) || 0)}
                          min={0}
                          max={50}
                          className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album Artwork Modal */}
      <AnimatePresence>
        {showArtworkModal && pendingAudioFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 rounded-2xl max-w-md w-full mx-4 border border-neon-cyan/30"
            >
              <h3 className="font-grunge-alt text-xl text-neon-cyan mb-4">
                Add Album Artwork
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Adding artwork for: <span className="text-white">{pendingAudioFile.name}</span>
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Image will be resized to 3000×3000 pixels for optimal display in the music system.
              </p>

              <input
                ref={artworkInputRef}
                type="file"
                accept="image/*"
                onChange={handleArtworkSelect}
                className="hidden"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => artworkInputRef.current?.click()}
                  className="flex-1 neon-button py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  🖼️ Select Artwork
                </button>
                <button
                  onClick={handleSkipArtwork}
                  className="flex-1 glass-panel py-3 rounded-lg hover:border-gray-500 transition-colors"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MediaUploader;
