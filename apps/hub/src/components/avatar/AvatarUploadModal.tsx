'use client';

import { useState, useRef } from 'react';
import { qorAuth, type User } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (avatarUrl: string) => void;
  user: User;
}

export function AvatarUploadModal({ isOpen, onClose, onSuccess, user }: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get blockchain context - must be called unconditionally
  // This component should only be rendered when inside BlockchainProvider
  const blockchainContext = useBlockchain();
  const isConnected = blockchainContext.isConnected;
  const connect = blockchainContext.connect;

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Ensure blockchain is connected
      if (!isConnected) {
        await connect();
      }

      // Upload avatar (this returns the avatar URL)
      const avatarUrl = await qorAuth.uploadAvatar(selectedFile, user.qor_id);
      
      // TODO: Mint as DRC-369 NFT on-chain
      // This requires the user's wallet/keypair, which should be available from the blockchain context
      // For now, the backend returns the avatar URL and we'll mint it separately
      // In a full implementation, you would:
      // 1. Get the user's keypair from their wallet
      // 2. Call blockchainClient.mintAvatarAsset(keypair, user.qor_id, avatarUrl)
      // 3. Wait for transaction confirmation
      
      onSuccess(avatarUrl);
      onClose();
      
      // Reset state
      setSelectedFile(null);
      setPreview(null);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setError(err.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setPreview(null);
      setError(null);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="glass-panel p-8 rounded-lg max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet bg-clip-text text-transparent">
            Upload Avatar
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview ? (
            <div className="mb-6 flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-demiurge-cyan/50 mb-4">
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-sm text-demiurge-cyan hover:text-demiurge-violet"
              >
                Choose different image
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Select Image
              </label>
              <div
                className="border-2 border-dashed border-demiurge-cyan/30 rounded-lg p-8 text-center cursor-pointer hover:border-demiurge-cyan/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-400 mb-1">Click to select an image</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mb-6 p-4 rounded-lg bg-demiurge-cyan/10 border border-demiurge-cyan/20">
            <p className="text-sm text-gray-300">
              <span className="font-bold text-demiurge-cyan">✨ Your avatar will be minted as your first DRC-369 NFT!</span>
              <br />
              <span className="text-xs text-gray-400 mt-1 block">
                This soulbound asset will be permanently linked to your QOR ID on-chain.
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 glass-panel py-3 rounded-lg hover:chroma-glow transition-all font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 glass-panel py-3 rounded-lg hover:chroma-glow transition-all font-bold bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white disabled:opacity-50"
            >
              {uploading ? 'Uploading & Minting...' : 'Upload & Mint'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
