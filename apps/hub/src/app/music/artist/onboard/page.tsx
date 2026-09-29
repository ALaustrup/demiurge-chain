'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HolographicBadge } from '@/components/badges';
import { OFFICIAL_BADGES } from '@/lib/badges/official-badges';
import type { MintedBadge } from '@/lib/badges/types';

type OnboardingStep = 'terms' | 'profile' | 'minting' | 'complete';

export default function MusicArtistOnboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: isLoading } = useAuth();
  
  const [step, setStep] = useState<OnboardingStep>('terms');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintedBadge, setMintedBadge] = useState<MintedBadge | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    artistName: '',
    genre: '',
    bio: '',
    soundcloudUrl: '',
    spotifyUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    websiteUrl: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Check if user already has artist badge
  useEffect(() => {
    async function checkExistingBadge() {
      const walletAddress = user?.on_chain_address || user?.on_chain?.address;
      if (!walletAddress) return;
      
      try {
        const res = await fetch(`/api/badges/${walletAddress}`);
        const data = await res.json();
        
        if (data.success) {
          const artistBadge = data.collection.badges.find(
            (b: MintedBadge) => b.type === 'MUSIC_ARTIST'
          );
          if (artistBadge) {
            // Already has badge, redirect to artist dashboard
            router.push('/music/artist/dashboard');
          }
        }
      } catch (e) {
        // Continue with onboarding
      }
    }
    
    checkExistingBadge();
  }, [user, router]);

  const handleSubmit = async () => {
    const walletAddress = user?.on_chain_address || user?.on_chain?.address;
    if (!walletAddress || !user?.qor_id) {
      setError('Wallet not connected');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStep('minting');

    try {
      // Step 1: Create artist profile
      const profileRes = await fetch('/api/music/artist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qorId: user.qor_id,
          walletAddress: walletAddress,
          ...formData,
        }),
      });

      const profileData = await profileRes.json();
      
      if (!profileData.success) {
        throw new Error(profileData.error || 'Failed to create artist profile');
      }

      // Step 2: Mint the Music Artist badge
      const mintRes = await fetch('/api/badges/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress: walletAddress,
          recipientQorId: user.qor_id,
          badgeType: 'MUSIC_ARTIST',
          context: {
            artistProfileId: profileData.artistId,
          },
        }),
      });

      const mintData = await mintRes.json();
      
      if (!mintData.success) {
        throw new Error(mintData.error || 'Failed to mint badge');
      }

      // Create the minted badge object for display
      const badge = OFFICIAL_BADGES.MUSIC_ARTIST;
      setMintedBadge({
        tokenId: mintData.tokenId,
        type: 'MUSIC_ARTIST',
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl,
        animatedUrl: badge.animatedUrl,
        category: badge.category,
        rarity: badge.rarity,
        holographicEffect: badge.holographicEffect,
        glowColor: badge.glowColor,
        borderGradient: badge.borderGradient,
        mintedAt: Date.now(),
        mintBlock: 0,
        txHash: mintData.txHash || '',
        isAuthentic: true,
        issuerVerified: true,
      });

      setStep('complete');

    } catch (err: any) {
      setError(err.message);
      setStep('profile'); // Go back to profile step
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Become a Music Artist
          </h1>
          <p className="mt-2 text-text-secondary">
            Join QOR Music and release your music on-chain
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['terms', 'profile', 'minting', 'complete'] as OnboardingStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s 
                    ? 'bg-neon-cyan text-void' 
                    : ['terms', 'profile', 'minting', 'complete'].indexOf(step) > i
                      ? 'bg-status-online text-void'
                      : 'bg-white/10 text-text-tertiary'
                  }`}
              >
                {['terms', 'profile', 'minting', 'complete'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && (
                <div className={`w-12 h-0.5 mx-1 ${
                  ['terms', 'profile', 'minting', 'complete'].indexOf(step) > i
                    ? 'bg-status-online'
                    : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Terms of Service */}
          {step === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-pane rounded-xl p-6"
            >
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
                Terms of Service
              </h2>
              
              <div className="h-64 overflow-y-auto bg-void/50 rounded-lg p-4 text-sm text-text-secondary space-y-4 mb-6">
                <h3 className="text-text-primary font-medium">QOR Music Distribution Agreement</h3>
                
                <p>
                  By registering as a Music Artist on Demiurge-Cloud, you agree to the following terms:
                </p>
                
                <h4 className="text-text-primary font-medium mt-4">1. Content Ownership</h4>
                <p>
                  You represent and warrant that you own or have the necessary licenses, rights, 
                  consents, and permissions to publish, distribute, and monetize all music content 
                  you submit to the platform.
                </p>
                
                <h4 className="text-text-primary font-medium mt-4">2. Sovereign Platform</h4>
                <p>
                  Demiurge-Cloud operates as a sovereign digital platform. All music released 
                  on-chain is subject to the laws and regulations applicable in your jurisdiction. 
                  You are solely responsible for ensuring compliance with any local, national, or 
                  international laws regarding music distribution, copyright, and intellectual property.
                </p>
                
                <h4 className="text-text-primary font-medium mt-4">3. Revenue & Royalties</h4>
                <p>
                  Artists receive royalties as defined by the DRC-369 NFT standard. Platform fees 
                  are deducted at the time of sale and contributed to the Global Treasury for 
                  ongoing platform operations.
                </p>
                
                <h4 className="text-text-primary font-medium mt-4">4. Release Pricing</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Singles (1-3 tracks): 20 CGT</li>
                  <li>EPs (4-7 tracks): 50 CGT</li>
                  <li>Albums (8+ tracks): 75 CGT</li>
                </ul>
                
                <h4 className="text-text-primary font-medium mt-4">5. Artist Badge</h4>
                <p>
                  Upon registration, you will receive a soulbound Music Artist NFT badge (DRC-369). 
                  This badge is non-transferable and grants access to the music distribution platform.
                </p>
                
                <h4 className="text-text-primary font-medium mt-4">6. Content Guidelines</h4>
                <p>
                  All content must comply with community guidelines. Content that infringes on 
                  copyrights, promotes hate, or violates applicable laws may be removed.
                </p>
                
                <h4 className="text-text-primary font-medium mt-4">7. Verification</h4>
                <p>
                  Artist accounts may be subject to verification to prevent impersonation of 
                  established artists. Providing false information may result in account termination.
                </p>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 
                             checked:bg-neon-cyan checked:border-neon-cyan cursor-pointer"
                />
                <span className="text-sm text-text-secondary">
                  I have read and agree to the Terms of Service. I understand that my music 
                  releases are subject to applicable laws in my jurisdiction.
                </span>
              </label>
              
              <button
                onClick={() => setStep('profile')}
                disabled={!termsAccepted}
                className="w-full cmd-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Profile Setup
              </button>
            </motion.div>
          )}

          {/* Profile Setup */}
          {step === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-pane rounded-xl p-6"
            >
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
                Artist Profile
              </h2>
              
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                {/* Artist Name */}
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Artist Name <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    placeholder="Your stage name"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                               text-text-primary placeholder:text-text-tertiary
                               focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                               transition-all"
                    required
                  />
                </div>
                
                {/* Genre */}
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Primary Genre <span className="text-status-error">*</span>
                  </label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                               text-text-primary
                               focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                               transition-all"
                    required
                  >
                    <option value="">Select a genre</option>
                    <option value="electronic">Electronic</option>
                    <option value="hip-hop">Hip-Hop / Rap</option>
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="indie">Indie</option>
                    <option value="r&b">R&B / Soul</option>
                    <option value="jazz">Jazz</option>
                    <option value="classical">Classical</option>
                    <option value="ambient">Ambient</option>
                    <option value="experimental">Experimental</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Bio */}
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself and your music..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                               text-text-primary placeholder:text-text-tertiary resize-none
                               focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30
                               transition-all"
                  />
                </div>
                
                {/* Social Links */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-medium text-text-primary mb-3">
                    Social Links (Optional)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SocialInput
                      label="SoundCloud"
                      icon="🎵"
                      value={formData.soundcloudUrl}
                      onChange={(v) => setFormData({ ...formData, soundcloudUrl: v })}
                      placeholder="soundcloud.com/..."
                    />
                    <SocialInput
                      label="Spotify"
                      icon="🎧"
                      value={formData.spotifyUrl}
                      onChange={(v) => setFormData({ ...formData, spotifyUrl: v })}
                      placeholder="open.spotify.com/artist/..."
                    />
                    <SocialInput
                      label="Instagram"
                      icon="📷"
                      value={formData.instagramUrl}
                      onChange={(v) => setFormData({ ...formData, instagramUrl: v })}
                      placeholder="instagram.com/..."
                    />
                    <SocialInput
                      label="Twitter/X"
                      icon="🐦"
                      value={formData.twitterUrl}
                      onChange={(v) => setFormData({ ...formData, twitterUrl: v })}
                      placeholder="twitter.com/..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('terms')}
                  className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 
                             text-text-secondary hover:text-text-primary hover:bg-white/10
                             transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.artistName || !formData.genre || isSubmitting}
                  className="flex-1 cmd-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Minting */}
          {step === 'minting' && (
            <motion.div
              key="minting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-pane rounded-xl p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan animate-spin" />
                <div className="absolute inset-2 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                  <span className="text-3xl">🎵</span>
                </div>
              </div>
              
              <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
                Minting Your Artist Badge
              </h2>
              <p className="text-text-secondary text-sm">
                Creating your profile and minting your official Music Artist NFT badge...
              </p>
              
              <div className="mt-6 space-y-2 text-left text-sm">
                <StatusLine done label="Creating artist profile" />
                <StatusLine label="Minting DRC-369 badge" />
                <StatusLine label="Recording on-chain" />
              </div>
            </motion.div>
          )}

          {/* Complete */}
          {step === 'complete' && mintedBadge && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-pane rounded-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-6"
              >
                <HolographicBadge badge={mintedBadge} size="xl" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
                  🎉 Welcome, Artist!
                </h2>
                <p className="text-text-secondary">
                  Your Music Artist badge has been minted to your wallet.
                </p>
                
                <div className="mt-6 p-4 rounded-lg bg-status-online/10 border border-status-online/30">
                  <p className="text-sm text-status-online">
                    You now have access to QOR Music. Start releasing your music on-chain!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => router.push('/wallet?tab=badges')}
                    className="flex-1 px-6 py-3 rounded-lg bg-white/5 border border-white/10 
                               text-text-secondary hover:text-text-primary hover:bg-white/10
                               transition-all"
                  >
                    View in Wallet
                  </button>
                  <button
                    onClick={() => router.push('/music/release/new')}
                    className="flex-1 cmd-button"
                  >
                    Create Your First Release
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SocialInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-tertiary mb-1 flex items-center gap-1">
        <span>{icon}</span> {label}
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                   text-text-primary text-sm placeholder:text-text-tertiary
                   focus:border-neon-cyan/50 focus:outline-none
                   transition-all"
      />
    </div>
  );
}

function StatusLine({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      {done ? (
        <span className="text-status-online">✓</span>
      ) : (
        <span className="w-4 h-4 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
      )}
      <span className={done ? 'text-status-online' : ''}>{label}</span>
    </div>
  );
}
