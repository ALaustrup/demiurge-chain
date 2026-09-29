'use client';

import { useState, useRef } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import { uploadNFTToIPFS, ipfsToHttp } from '@/lib/ipfs-client';
import type { ProfileTheme } from '@/lib/vyb/types';

const COLOR_PRESETS = [
  { name: 'Neon Cyan', primary: '#00f5ff', secondary: '#bf00ff' },
  { name: 'Hot Pink', primary: '#ff00ff', secondary: '#00ffff' },
  { name: 'Sunset', primary: '#ff6b35', secondary: '#f7c59f' },
  { name: 'Matrix', primary: '#00ff41', secondary: '#008f11' },
  { name: 'Royal', primary: '#7b2cbf', secondary: '#c77dff' },
  { name: 'Ocean', primary: '#0096c7', secondary: '#90e0ef' },
  { name: 'Fire', primary: '#ff4500', secondary: '#ff8c00' },
  { name: 'Midnight', primary: '#1a1a2e', secondary: '#16213e' },
];

const FONT_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary' },
  { id: 'retro', name: 'Retro', description: 'Old school vibes' },
  { id: 'grunge', name: 'Grunge', description: 'Raw and edgy' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
];

const LAYOUT_STYLES = [
  { id: 'classic', name: 'Classic', icon: '📋' },
  { id: 'grid', name: 'Grid', icon: '⊞' },
  { id: 'timeline', name: 'Timeline', icon: '📰' },
  { id: 'gallery', name: 'Gallery', icon: '🖼️' },
];

const MUSIC_PLAYER_STYLES = [
  { id: 'minimal', name: 'Minimal', description: 'Compact bar' },
  { id: 'full', name: 'Full', description: 'Full player controls' },
  { id: 'compact', name: 'Compact', description: 'Small floating button' },
];

export function ProfileCustomizer() {
  const { profile, updateTheme } = useVYB();
  const [isOpen, setIsOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState<ProfileTheme | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [musicUploading, setMusicUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const currentTheme = localTheme || profile.theme;

  const handleOpen = () => {
    setLocalTheme({ ...profile.theme });
    setIsOpen(true);
    setUploadError(null);
  };

  const handleSave = async () => {
    if (localTheme) {
      await updateTheme(localTheme);
    }
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: typeof COLOR_PRESETS[0]) => {
    setLocalTheme(prev => ({
      ...prev!,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // 10MB limit for banner images
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Banner image must be under 10MB');
      return;
    }

    setBannerUploading(true);
    setUploadError(null);

    try {
      // Create a canvas to resize to banner aspect ratio (4:1)
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = async (ev) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const targetWidth = 1200;
          const targetHeight = 300;
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          const ctx = canvas.getContext('2d')!;
          // Cover-fit: center crop
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const sx = (img.width - targetWidth / scale) / 2;
          const sy = (img.height - targetHeight / scale) / 2;
          ctx.drawImage(img, sx, sy, targetWidth / scale, targetHeight / scale, 0, 0, targetWidth, targetHeight);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setUploadError('Failed to process image');
              setBannerUploading(false);
              return;
            }

            try {
              const bannerFile = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
              const result = await uploadNFTToIPFS(bannerFile, {
                name: `${profile.qorId}-banner`,
                description: 'Profile banner',
                attributes: [],
              });
              const bannerUrl = ipfsToHttp(result.mediaUri || '');
              setLocalTheme(prev => ({ ...prev!, bannerImage: bannerUrl }));
            } catch {
              setUploadError('Failed to upload banner');
            } finally {
              setBannerUploading(false);
            }
          }, 'image/jpeg', 0.9);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError('Failed to process banner image');
      setBannerUploading(false);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate audio type
    if (!file.type.startsWith('audio/')) {
      setUploadError('Please select an audio file (MP3, OGG, etc.)');
      return;
    }

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Music file must be under 100MB');
      return;
    }

    setMusicUploading(true);
    setUploadError(null);

    try {
      const result = await uploadNFTToIPFS(file, {
        name: `${profile.qorId}-music`,
        description: 'Profile music',
        attributes: [],
      });
      const musicUrl = ipfsToHttp(result.mediaUri || '');
      setLocalTheme(prev => ({ ...prev!, musicFile: musicUrl, musicEnabled: true }));
    } catch {
      setUploadError('Failed to upload music file');
    } finally {
      setMusicUploading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors"
        title="Customize Profile"
      >
        🎨 Customize
      </button>

      {/* Customizer Modal */}
      {isOpen && localTheme && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-grunge text-2xl text-neon-cyan">🎨 Customize Your Profile</h2>
              <p className="text-gray-400 text-sm">Make it yours - MySpace style!</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Preview */}
              <div 
                className="rounded-xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${localTheme.primaryColor}20, ${localTheme.secondaryColor}20)`,
                  border: `1px solid ${localTheme.primaryColor}40`,
                }}
              >
                <div 
                  className="h-16"
                  style={{
                    background: `linear-gradient(to right, ${localTheme.primaryColor}, ${localTheme.secondaryColor})`
                  }}
                />
                <div className="p-4 -mt-8 flex items-end gap-4">
                  <div 
                    className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl"
                    style={{ 
                      borderColor: localTheme.backgroundColor,
                      background: `linear-gradient(135deg, ${localTheme.primaryColor}80, ${localTheme.secondaryColor}80)`
                    }}
                  >
                    👤
                  </div>
                  <div className="pb-1">
                    <h3 
                      className="font-grunge-alt text-lg"
                      style={{ color: localTheme.primaryColor }}
                    >
                      {profile.displayName}
                    </h3>
                    <p className="text-gray-400 text-xs">@{profile.qorId}</p>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Color Theme</h3>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={`p-3 rounded-lg border transition-all ${
                        localTheme.primaryColor === preset.primary 
                          ? 'border-white' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                      }}
                    >
                      <span className="text-white text-xs font-body drop-shadow">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localTheme.primaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localTheme.primaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, primaryColor: e.target.value }))}
                      className="flex-1 bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localTheme.secondaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, secondaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localTheme.secondaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, secondaryColor: e.target.value }))}
                      className="flex-1 bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Font Style */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Font Style</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_STYLES.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setLocalTheme(prev => ({ ...prev!, fontStyle: font.id as any }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        localTheme.fontStyle === font.id 
                          ? 'border-neon-cyan bg-neon-cyan/10' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-white font-body">{font.name}</p>
                      <p className="text-gray-500 text-xs">{font.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Style */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Layout Style</h3>
                <div className="grid grid-cols-4 gap-2">
                  {LAYOUT_STYLES.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setLocalTheme(prev => ({ ...prev!, layoutStyle: layout.id as any }))}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        localTheme.layoutStyle === layout.id 
                          ? 'border-neon-cyan bg-neon-cyan/10' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-2xl mb-1">{layout.icon}</p>
                      <p className="text-white text-xs">{layout.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Profile Banner</h3>
                <div className="space-y-3">
                  {localTheme.bannerImage && (
                    <div className="relative rounded-lg overflow-hidden h-20">
                      <img src={localTheme.bannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setLocalTheme(prev => ({ ...prev!, bannerImage: undefined }))}
                        className="absolute top-1 right-1 bg-red-500/80 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={bannerUploading}
                    className="w-full glass-panel py-2 rounded-lg hover:border-neon-cyan/50 transition-colors text-sm disabled:opacity-50"
                  >
                    {bannerUploading ? '⏳ Uploading...' : '📷 Upload Banner Image'}
                  </button>
                  <p className="text-gray-500 text-xs">Image auto-resized to 1200x300. Max 10MB.</p>
                </div>
              </div>

              {/* Profile Music */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-grunge-alt text-lg text-white">Profile Music</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localTheme.musicEnabled}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, musicEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-neon-cyan"
                    />
                    <span className="text-sm text-gray-400">Enable</span>
                  </label>
                </div>
                {localTheme.musicEnabled && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={localTheme.profileSong || ''}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, profileSong: e.target.value }))}
                      placeholder="Paste music URL (YouTube, SoundCloud, etc.)"
                      className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    />
                    <div className="text-gray-400 text-center text-xs">— or —</div>
                    <input
                      ref={musicInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => musicInputRef.current?.click()}
                      disabled={musicUploading}
                      className="w-full glass-panel py-2 rounded-lg hover:border-neon-cyan/50 transition-colors text-sm disabled:opacity-50"
                    >
                      {musicUploading ? '⏳ Uploading music...' : '🎵 Upload Your Own Music'}
                    </button>
                    {localTheme.musicFile && (
                      <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg px-3 py-2">
                        <span className="text-neon-cyan">🎵</span>
                        <span className="text-gray-300 text-sm flex-1 truncate">{localTheme.musicFile}</span>
                        <button
                          onClick={() => setLocalTheme(prev => ({ ...prev!, musicFile: undefined }))}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <p className="text-gray-500 text-xs">Upload MP3/OGG up to 100MB. Auto-plays on profile visits.</p>

                    {/* Player Style */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Player Style</p>
                      <div className="grid grid-cols-3 gap-2">
                        {MUSIC_PLAYER_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setLocalTheme(prev => ({ ...prev!, musicPlayerStyle: style.id as any }))}
                            className={`p-2 rounded-lg border text-center transition-all ${
                              (localTheme.musicPlayerStyle || 'minimal') === style.id
                                ? 'border-neon-cyan bg-neon-cyan/10'
                                : 'border-gray-700 hover:border-gray-500'
                            }`}
                          >
                            <p className="text-white text-xs">{style.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Player Color */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Player Color</span>
                      <input
                        type="color"
                        value={localTheme.musicPlayerColor || localTheme.primaryColor}
                        onChange={(e) => setLocalTheme(prev => ({ ...prev!, musicPlayerColor: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 neon-button py-2 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
