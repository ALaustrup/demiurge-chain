'use client';

import { useState, useEffect } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { validateArtistName, NameValidationResult } from '@/lib/music/artist-validation';

interface ArtistOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (artistId: string) => void;
}

type OnboardingStep = 'info' | 'socials' | 'stake' | 'terms' | 'minting' | 'success';

// Stake amount required to become an artist
const ARTIST_STAKE_AMOUNT = 50; // CGT

interface ArtistFormData {
  artistName: string;
  primaryGenre: string;
  bio: string;
  soundcloud: string;
  spotify: string;
  appleMusic: string;
  twitter: string;
  instagram: string;
  bandcamp: string;
  website: string;
  agreedToTerms: boolean;
}

const GENRES = [
  'Electronic', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Metal', 'Jazz', 'Classical',
  'Country', 'Folk', 'Indie', 'Alternative', 'Ambient', 'Synthwave', 'Lo-Fi',
  'House', 'Techno', 'Drum & Bass', 'Dubstep', 'Reggae', 'World', 'Other'
];

export function ArtistOnboarding({ isOpen, onClose, onSuccess }: ArtistOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  
  // Name validation state
  const [nameValidation, setNameValidation] = useState<NameValidationResult | null>(null);
  const [isValidatingName, setIsValidatingName] = useState(false);
  
  // Stake confirmation
  const [stakeConfirmed, setStakeConfirmed] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<ArtistFormData>({
    artistName: '',
    primaryGenre: '',
    bio: '',
    soundcloud: '',
    spotify: '',
    appleMusic: '',
    twitter: '',
    instagram: '',
    bandcamp: '',
    website: '',
    agreedToTerms: false,
  });

  const isAuthenticated = qorAuth.isAuthenticated();

  const updateForm = (field: keyof ArtistFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // Validate name on change
    if (field === 'artistName' && typeof value === 'string') {
      validateName(value);
    }
  };

  const validateName = async (name: string) => {
    if (!name || name.length < 2) {
      setNameValidation(null);
      return;
    }
    
    setIsValidatingName(true);
    
    // Small delay to debounce
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = validateArtistName(name);
    setNameValidation(result);
    setIsValidatingName(false);
  };

  // Fetch user balance on mount
  useEffect(() => {
    if (isOpen && qorAuth.isAuthenticated()) {
      fetchBalance();
    }
  }, [isOpen]);

  const fetchBalance = async () => {
    try {
      // Fetch actual CGT balance from blockchain
      const profile = await qorAuth.getProfile();
      const address = profile.on_chain_address || profile.on_chain?.address;
      
      if (address) {
        const { demiurgeRpc } = await import('@/lib/demiurge-rpc');
        const balanceStr = await demiurgeRpc.getBalance(address);
        // Balance is in smallest units, convert to CGT
        const balance = parseInt(balanceStr || '0') / 100;
        setUserBalance(balance);
      } else {
        setUserBalance(0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setUserBalance(0);
    }
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 'info':
        if (!formData.artistName.trim()) {
          setError('Artist name is required');
          return false;
        }
        if (formData.artistName.length < 2 || formData.artistName.length > 50) {
          setError('Artist name must be 2-50 characters');
          return false;
        }
        if (!formData.primaryGenre) {
          setError('Please select a primary genre');
          return false;
        }
        // Check name validation
        if (nameValidation && !nameValidation.isValid) {
          setError(nameValidation.message || 'This artist name is not available');
          return false;
        }
        return true;
      case 'socials':
        // At least one social link is recommended but not required
        return true;
      case 'stake':
        if (!stakeConfirmed) {
          setError('You must confirm the stake to continue');
          return false;
        }
        if (userBalance !== null && userBalance < ARTIST_STAKE_AMOUNT) {
          setError(`Insufficient balance. You need ${ARTIST_STAKE_AMOUNT} CGT to stake.`);
          return false;
        }
        return true;
      case 'terms':
        if (!formData.agreedToTerms) {
          setError('You must agree to the Terms of Service');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    switch (step) {
      case 'info':
        setStep('socials');
        break;
      case 'socials':
        setStep('stake');
        break;
      case 'stake':
        setStep('terms');
        break;
      case 'terms':
        handleMintBadge();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'socials':
        setStep('info');
        break;
      case 'stake':
        setStep('socials');
        break;
      case 'terms':
        setStep('stake');
        break;
    }
  };

  const handleMintBadge = async () => {
    setStep('minting');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/music/artist/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
        body: JSON.stringify({
          artistName: formData.artistName,
          primaryGenre: formData.primaryGenre,
          bio: formData.bio,
          socialLinks: {
            soundcloud: formData.soundcloud || undefined,
            spotify: formData.spotify || undefined,
            appleMusic: formData.appleMusic || undefined,
            twitter: formData.twitter || undefined,
            instagram: formData.instagram || undefined,
            bandcamp: formData.bandcamp || undefined,
            website: formData.website || undefined,
          },
          stakeAmount: ARTIST_STAKE_AMOUNT,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register as artist');
      }

      const data = await response.json();
      setArtistId(data.artistId);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create artist profile');
      setStep('terms');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (artistId) {
      onSuccess(artistId);
    }
    onClose();
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="glass-panel p-8 max-w-md w-full mx-4 rounded-2xl border border-neon-cyan/30">
          <h2 className="text-2xl font-grunge text-neon-cyan mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">You need to be logged in to become a music artist.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 glass-panel py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <a
              href="/login"
              className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold py-3 rounded-lg text-center hover:opacity-90 transition-opacity"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8">
      <div className="glass-panel p-8 max-w-2xl w-full mx-4 rounded-2xl border border-neon-magenta/30 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl"
        >
          ✕
        </button>

        {/* Progress indicator */}
        {step !== 'success' && step !== 'minting' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['info', 'socials', 'stake', 'terms'].map((s, i) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step === s ? 'bg-neon-magenta' : 
                  ['info', 'socials', 'stake', 'terms'].indexOf(step) > i ? 'bg-neon-cyan' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Artist Info */}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                Become a Music Artist
              </h2>
              <p className="text-gray-400 mt-2">Step 1: Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Artist / Band Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.artistName}
                    onChange={(e) => updateForm('artistName', e.target.value)}
                    placeholder="Your stage name or band name"
                    className={`w-full bg-black/50 border-2 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      nameValidation && !nameValidation.isValid 
                        ? 'border-red-500 focus:border-red-500' 
                        : nameValidation?.isValid 
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-gray-700 focus:border-neon-magenta'
                    }`}
                    maxLength={50}
                  />
                  {isValidatingName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {nameValidation && !isValidatingName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameValidation.isValid ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✕</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Name validation warnings */}
                {nameValidation && !nameValidation.isValid && (
                  <div className="mt-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-red-400">⚠</span>
                      <div>
                        <p className="text-red-400 text-sm">{nameValidation.message}</p>
                        {nameValidation.similarTo && (
                          <p className="text-gray-400 text-xs mt-1">
                            Similar to: <span className="text-white">{nameValidation.similarTo}</span>
                            {nameValidation.similarityScore && (
                              <span className="text-gray-500"> ({Math.round(nameValidation.similarityScore * 100)}% match)</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {nameValidation?.isValid && (
                  <p className="text-xs text-green-400 mt-1">✓ This name is available</p>
                )}
                
                {!nameValidation && (
                  <p className="text-xs text-gray-500 mt-1">This will be your public artist name</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Primary Genre *</label>
                <select
                  value={formData.primaryGenre}
                  onChange={(e) => updateForm('primaryGenre', e.target.value)}
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white focus:border-neon-magenta focus:outline-none transition-colors"
                >
                  <option value="">Select a genre...</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Bio (optional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateForm('bio', e.target.value)}
                  placeholder="Tell fans about your music journey..."
                  rows={3}
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-neon-magenta focus:outline-none transition-colors resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Social Links */}
        {step === 'socials' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                Connect Your Profiles
              </h2>
              <p className="text-gray-400 mt-2">Step 2: Link your music platforms</p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                <strong>Verification Tip:</strong> Artists with verified social profiles get a 
                <span className="text-neon-cyan"> Verified Badge</span> and featured placement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-orange-400">●</span> SoundCloud
                </label>
                <input
                  type="url"
                  value={formData.soundcloud}
                  onChange={(e) => updateForm('soundcloud', e.target.value)}
                  placeholder="https://soundcloud.com/yourname"
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-orange-400 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-green-400">●</span> Spotify
                </label>
                <input
                  type="url"
                  value={formData.spotify}
                  onChange={(e) => updateForm('spotify', e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-pink-400">●</span> Apple Music
                </label>
                <input
                  type="url"
                  value={formData.appleMusic}
                  onChange={(e) => updateForm('appleMusic', e.target.value)}
                  placeholder="https://music.apple.com/artist/..."
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-cyan-400">●</span> Bandcamp
                </label>
                <input
                  type="url"
                  value={formData.bandcamp}
                  onChange={(e) => updateForm('bandcamp', e.target.value)}
                  placeholder="https://yourname.bandcamp.com"
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-blue-400">●</span> Twitter / X
                </label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => updateForm('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourname"
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-purple-400">●</span> Instagram
                </label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => updateForm('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourname"
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none transition-colors text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-2">
                  <span className="text-gray-400">●</span> Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateForm('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-black/50 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-gray-400 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 glass-panel py-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stake Requirement */}
        {step === 'stake' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                Security Stake
              </h2>
              <p className="text-gray-400 mt-2">Step 3: Stake CGT to prevent impersonation</p>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-neon-cyan/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-xl">
                    🔒
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Artist Security Stake</h3>
                    <p className="text-gray-400 text-sm">Refundable after 30 days</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-neon-cyan">{ARTIST_STAKE_AMOUNT} CGT</div>
                  <div className="text-xs text-gray-500">Required</div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="text-neon-cyan">✓</span>
                  <span>Stake is held for 30 days, then fully refundable</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neon-cyan">✓</span>
                  <span>Deters fake accounts and impersonators</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neon-cyan">✓</span>
                  <span>Staked artists get priority in search results</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">⚠</span>
                  <span>If reported and confirmed as impersonator, stake is forfeited</span>
                </div>
              </div>
            </div>

            {/* Balance info */}
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
              <span className="text-gray-400">Your Balance:</span>
              <span className={`font-bold ${userBalance !== null && userBalance >= ARTIST_STAKE_AMOUNT ? 'text-green-400' : 'text-red-400'}`}>
                {userBalance !== null ? `${userBalance.toLocaleString()} CGT` : 'Loading...'}
              </span>
            </div>

            {userBalance !== null && userBalance < ARTIST_STAKE_AMOUNT && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  Insufficient balance. You need at least {ARTIST_STAKE_AMOUNT} CGT to become an artist.
                </p>
                <a
                  href="/staking"
                  className="text-neon-cyan hover:underline text-sm mt-2 inline-block"
                >
                  Get CGT →
                </a>
              </div>
            )}

            {/* Stake confirmation */}
            <div className="flex items-start gap-3 p-4 bg-neon-magenta/10 border border-neon-magenta/30 rounded-lg">
              <input
                type="checkbox"
                id="stake-confirm"
                checked={stakeConfirmed}
                onChange={(e) => {
                  setStakeConfirmed(e.target.checked);
                  setError(null);
                }}
                className="mt-1 w-5 h-5 rounded border-gray-600 bg-black/50 text-neon-magenta focus:ring-neon-magenta"
              />
              <label htmlFor="stake-confirm" className="text-gray-300 text-sm cursor-pointer">
                I understand that <span className="text-neon-magenta font-bold">{ARTIST_STAKE_AMOUNT} CGT</span> will be 
                staked from my wallet. This stake is refundable after 30 days if my account remains in good standing.
                If I am found to be impersonating another artist, my stake will be forfeited.
              </label>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 glass-panel py-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!stakeConfirmed || (userBalance !== null && userBalance < ARTIST_STAKE_AMOUNT)}
                className={`flex-1 py-4 rounded-lg font-bold transition-opacity ${
                  stakeConfirmed && (userBalance === null || userBalance >= ARTIST_STAKE_AMOUNT)
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-magenta text-black hover:opacity-90' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Stake {ARTIST_STAKE_AMOUNT} CGT & Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Terms of Service */}
        {step === 'terms' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-grunge bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                Terms of Service
              </h2>
              <p className="text-gray-400 mt-2">Step 4: Review and accept</p>
            </div>

            <div className="bg-black/50 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto text-sm text-gray-300 space-y-4">
              <h3 className="text-white font-bold">QOR MUSIC Distribution Agreement</h3>
              
              <p>
                By registering as a Music Artist on the Demiurge-Cloud platform, you agree to the following terms:
              </p>

              <div>
                <h4 className="text-neon-cyan font-semibold">1. Sovereign Digital Platform</h4>
                <p className="text-gray-400 mt-1">
                  Demiurge-Cloud operates as a sovereign digital release platform. All music released 
                  on-chain is permanently recorded and distributed through decentralized infrastructure.
                </p>
              </div>

              <div>
                <h4 className="text-neon-cyan font-semibold">2. Content Ownership</h4>
                <p className="text-gray-400 mt-1">
                  You retain full ownership of your music. Demiurge does not claim any rights to your content. 
                  You grant Demiurge a non-exclusive license to distribute your music through the platform.
                </p>
              </div>

              <div>
                <h4 className="text-neon-cyan font-semibold">3. Original Content</h4>
                <p className="text-gray-400 mt-1">
                  You certify that all music you upload is original work or that you have obtained all 
                  necessary rights, licenses, and permissions. You are solely responsible for any 
                  copyright infringement claims.
                </p>
              </div>

              <div>
                <h4 className="text-neon-cyan font-semibold">4. Regional Compliance</h4>
                <p className="text-gray-400 mt-1">
                  You agree to comply with all applicable music distribution laws and regulations in your 
                  region. This includes but is not limited to copyright law, mechanical licensing, and 
                  royalty obligations.
                </p>
              </div>

              <div>
                <h4 className="text-neon-cyan font-semibold">5. Impersonation Policy</h4>
                <p className="text-gray-400 mt-1">
                  Creating an artist profile that impersonates another artist is strictly prohibited. 
                  Accounts found to be impersonating others will be suspended and may result in permanent 
                  ban and forfeiture of any staked CGT.
                </p>
              </div>

              <div>
                <h4 className="text-neon-cyan font-semibold">6. Release Fees</h4>
                <p className="text-gray-400 mt-1">
                  Minting music releases requires CGT payment: Singles (1-3 tracks) = 20 CGT, 
                  EPs (4-7 tracks) = 50 CGT, Albums (8+ tracks) = 75 CGT. These fees are non-refundable.
                </p>
              </div>

              <div>
                <h4 className="text-neon-cyan font-semibold">7. Platform Rights</h4>
                <p className="text-gray-400 mt-1">
                  Demiurge reserves the right to remove content that violates these terms, applicable law, 
                  or community guidelines. We may also suspend artist accounts pending investigation of 
                  reported violations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={formData.agreedToTerms}
                onChange={(e) => updateForm('agreedToTerms', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-600 bg-black/50 text-neon-magenta focus:ring-neon-magenta"
              />
              <label htmlFor="agree-terms" className="text-gray-300 text-sm cursor-pointer">
                I have read and agree to the Terms of Service. I confirm that I am the rightful owner 
                of the artist name I have registered and that all music I release will be original 
                content or properly licensed.
              </label>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 glass-panel py-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.agreedToTerms}
                className={`flex-1 py-4 rounded-lg font-bold transition-opacity ${
                  formData.agreedToTerms 
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-magenta text-black hover:opacity-90' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Create Artist Profile
              </button>
            </div>
          </div>
        )}

        {/* Minting Step */}
        {step === 'minting' && (
          <div className="text-center py-12 space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neon-cyan via-neon-magenta to-neon-green flex items-center justify-center animate-pulse">
              <span className="text-4xl">🎵</span>
            </div>
            <h2 className="text-2xl font-grunge text-neon-cyan">Creating Your Artist Profile...</h2>
            <p className="text-gray-400">Minting your Music Artist Badge NFT</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-neon-cyan flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            
            <div>
              <h2 className="text-3xl font-grunge text-green-400">Welcome, Artist!</h2>
              <p className="text-gray-400 mt-2">Your Music Artist Badge has been minted</p>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-neon-cyan/30">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-xl font-bold text-white">{formData.artistName}</h3>
              <p className="text-neon-magenta">{formData.primaryGenre}</p>
              <div className="mt-3 inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-300 text-xs">
                Unverified Artist
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Link your socials to get verified
              </p>
            </div>

            <div className="bg-neon-magenta/10 border border-neon-magenta/30 rounded-lg p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Stake Locked:</span>
                <span className="text-neon-magenta font-bold">{ARTIST_STAKE_AMOUNT} CGT</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Refundable after 30 days of good standing
              </p>
            </div>

            <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4">
              <h4 className="text-neon-cyan font-semibold mb-2">What's Next?</h4>
              <ul className="text-gray-300 text-sm space-y-1 text-left">
                <li>• Create your first release (Single, EP, or Album)</li>
                <li>• Upload your tracks and cover art</li>
                <li>• Set your pricing and royalties</li>
                <li>• Share with your fans on-chain!</li>
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start Creating Music
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
