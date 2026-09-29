'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Drc369Client } from '@demiurge/drc369-sdk';
import { mintDRC369, estimateFee } from '@/lib/transaction-builder';

interface MintNFTFormProps {
  onSuccess?: (tokenId: string) => void;
  onCancel?: () => void;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  collection?: string;
  attributes: { trait_type: string; value: string | number }[];
  dynamicState: {
    level: number;
    xp: number;
    [key: string]: any;
  };
  physics?: {
    mass: number;
    friction: number;
    restitution: number;
  };
}

export function MintNFTForm({ onSuccess, onCancel }: MintNFTFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'basic' | 'attributes' | 'physics' | 'review'>('basic');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedEnergy, setEstimatedEnergy] = useState(5);

  const [metadata, setMetadata] = useState<NFTMetadata>({
    name: '',
    description: '',
    image: '',
    collection: '',
    attributes: [],
    dynamicState: {
      level: 1,
      xp: 0,
    },
  });

  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });

  const handleBasicNext = () => {
    if (!metadata.name || !metadata.description) {
      setError('Name and description are required');
      return;
    }
    setError(null);
    setStep('attributes');
  };

  const addAttribute = () => {
    if (!newAttribute.trait_type || !newAttribute.value) return;
    
    setMetadata({
      ...metadata,
      attributes: [
        ...metadata.attributes,
        { ...newAttribute, value: isNaN(Number(newAttribute.value)) ? newAttribute.value : Number(newAttribute.value) },
      ],
    });
    setNewAttribute({ trait_type: '', value: '' });
  };

  const removeAttribute = (index: number) => {
    setMetadata({
      ...metadata,
      attributes: metadata.attributes.filter((_, i) => i !== index),
    });
  };

  const handleMint = async () => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    setMinting(true);
    setError(null);
    setSuccess(false);

    try {
      // Estimate energy cost
      const fee = await estimateFee({ type: 'drc369Mint', metadata });
      setEstimatedEnergy(fee.energy);

      // Build, sign, and submit minting transaction
      const hash = await mintDRC369(user, metadata);
      
      setTxHash(hash);
      setSuccess(true);
      
      // Extract token ID from hash (simplified)
      const tokenId = 'nft-' + hash.slice(0, 16);
      
      if (onSuccess) {
        onSuccess(tokenId);
      }
    } catch (err: any) {
      setError(err.message || 'Minting failed');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-grunge text-white mb-2">Mint DRC-369 NFT</h2>
        <p className="text-sm text-gray-400">
          Create a dynamic, evolving NFT on the Demiurge blockchain
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {['Basic', 'Attributes', 'Physics', 'Review'].map((label, idx) => {
          const stepIds = ['basic', 'attributes', 'physics', 'review'];
          const currentIdx = stepIds.indexOf(step);
          const isActive = idx === currentIdx;
          const isCompleted = idx < currentIdx;
          
          return (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan' :
                  isCompleted ? 'border-green-400 bg-green-400/20 text-green-400' :
                  'border-gray-600 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-400' : 'bg-gray-700'}`} />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Basic Info */}
        {step === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name *</label>
              <input
                type="text"
                value={metadata.name}
                onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                placeholder="Epic Sword of the Demiurge"
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Description *</label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                placeholder="A legendary blade forged in the fires of creation..."
                rows={4}
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Image URL</label>
              <input
                type="url"
                value={metadata.image}
                onChange={(e) => setMetadata({ ...metadata, image: e.target.value })}
                placeholder="https://ipfs.io/ipfs/Qm..."
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
              />
              <p className="text-xs text-gray-500 mt-1">IPFS, Arweave, or HTTP URL</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Collection (Optional)</label>
              <input
                type="text"
                value={metadata.collection}
                onChange={(e) => setMetadata({ ...metadata, collection: e.target.value })}
                placeholder="My Game Assets"
                className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleBasicNext}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan/70 text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all"
            >
              Next: Add Attributes →
            </button>
          </div>
        )}

        {/* Step 2: Attributes */}
        {step === 'attributes' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Static Attributes</h3>
              <p className="text-sm text-gray-400 mb-4">
                Add traits that won't change (rarity, type, etc.)
              </p>
            </div>

            {/* Attribute List */}
            {metadata.attributes.length > 0 && (
              <div className="space-y-2 mb-4">
                {metadata.attributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 glass-panel rounded-lg">
                    <div className="flex-1">
                      <span className="text-neon-cyan text-sm">{attr.trait_type}:</span>{' '}
                      <span className="text-white">{String(attr.value)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttribute(idx)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Attribute Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAttribute.trait_type}
                onChange={(e) => setNewAttribute({ ...newAttribute, trait_type: e.target.value })}
                placeholder="Trait name (e.g., Rarity)"
                className="flex-1 glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white text-sm"
              />
              <input
                type="text"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                placeholder="Value (e.g., Legendary)"
                className="flex-1 glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white text-sm"
              />
              <button
                type="button"
                onClick={addAttribute}
                className="px-4 py-3 bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/30 transition-all text-neon-cyan font-bold"
              >
                + Add
              </button>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('basic')}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('physics')}
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-cyan/70 text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all"
              >
                Next: Physics →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Physics (Optional) */}
        {step === 'physics' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Physics Properties (Optional)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Add physics metadata for game engine integration
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Mass (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={metadata.physics?.mass || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    physics: { ...metadata.physics!, mass: parseFloat(e.target.value) || 0 },
                  })}
                  placeholder="1.0"
                  className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Friction</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={metadata.physics?.friction || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    physics: { ...metadata.physics!, friction: parseFloat(e.target.value) || 0 },
                  })}
                  placeholder="0.5"
                  className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bounciness</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={metadata.physics?.restitution || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    physics: { ...metadata.physics!, restitution: parseFloat(e.target.value) || 0 },
                  })}
                  placeholder="0.3"
                  className="w-full glass-panel p-3 rounded-lg border border-white/10 focus:border-neon-cyan/50 outline-none text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
              <p className="text-neon-cyan text-sm">
                💡 Physics properties enable your NFT to behave realistically in game engines (UE5, Unity, etc.)
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('attributes')}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('review')}
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-cyan/70 text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all"
              >
                Review & Mint →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Review Your NFT</h3>
              <p className="text-sm text-gray-400 mb-4">
                Verify all details before minting on-chain
              </p>
            </div>

            {/* Preview Card */}
            <div className="glass-panel p-4 rounded-xl border border-neon-cyan/30">
              <div className="flex gap-4">
                {/* Image Preview */}
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
                  {metadata.image ? (
                    <img src={metadata.image} alt={metadata.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🖼️</span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="text-xs text-gray-400">Name</div>
                    <div className="text-white font-bold">{metadata.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Description</div>
                    <div className="text-sm text-gray-300">{metadata.description}</div>
                  </div>
                  {metadata.collection && (
                    <div>
                      <div className="text-xs text-gray-400">Collection</div>
                      <div className="text-sm text-neon-cyan">{metadata.collection}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attributes */}
              {metadata.attributes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Attributes</div>
                  <div className="flex flex-wrap gap-2">
                    {metadata.attributes.map((attr, idx) => (
                      <div key={idx} className="px-2 py-1 bg-black/30 rounded text-xs">
                        <span className="text-neon-cyan">{attr.trait_type}:</span>{' '}
                        <span className="text-white">{String(attr.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physics */}
              {metadata.physics && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Physics Properties</div>
                  <div className="text-xs text-gray-300 space-y-1">
                    {metadata.physics.mass > 0 && <div>Mass: {metadata.physics.mass} kg</div>}
                    {metadata.physics.friction > 0 && <div>Friction: {metadata.physics.friction}</div>}
                    {metadata.physics.restitution > 0 && <div>Bounciness: {metadata.physics.restitution}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Success */}
            {success && txHash && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">✅ NFT Minted Successfully!</p>
                <p className="text-xs text-gray-300">Transaction Hash:</p>
                <p className="text-xs font-mono text-green-400 break-all">{txHash}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Your NFT will appear in your collection once the transaction is confirmed (~2 seconds)
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Energy Cost */}
            <div className="p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Minting Cost:</span>
                <span className="text-neon-cyan font-bold">{estimatedEnergy} Energy (0 CGT fees)</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('physics')}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 glass-panel py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMint}
                disabled={minting}
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {minting ? 'Minting...' : '🔨 Mint NFT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
