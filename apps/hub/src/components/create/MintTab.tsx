'use client';

import { useState, useCallback } from 'react';
import { ResourceUploader, type UploadedResource } from './ResourceUploader';
import { uploadToIPFS } from '@/lib/ipfs-client';

interface MintTabProps {
  onMintSuccess: (nftId: string) => void;
}

type MintStep = 'media' | 'metadata' | 'config' | 'review';

interface Attribute {
  trait_type: string;
  value: string;
}

interface EquipmentSlotDef {
  name: string;
  requiredTrait: string;
  capacity: number;
}

interface MintFormData {
  // Step 1 - Media
  resources: UploadedResource[];
  // Step 2 - Metadata
  name: string;
  description: string;
  attributes: Attribute[];
  collection: string;
  // Step 3 - Config
  royaltyBps: number;
  isSoulbound: boolean;
  equipmentSlots: EquipmentSlotDef[];
  initialXp: number;
  customState: Record<string, string>;
}

const STEPS: { id: MintStep; label: string; icon: string }[] = [
  { id: 'media', label: 'Media Upload', icon: '📁' },
  { id: 'metadata', label: 'Metadata', icon: '📋' },
  { id: 'config', label: 'DRC-369 Config', icon: '⚙️' },
  { id: 'review', label: 'Review & Mint', icon: '⚡' },
];

export function MintTab({ onMintSuccess }: MintTabProps) {
  const [currentStep, setCurrentStep] = useState<MintStep>('media');
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<MintFormData>({
    resources: [],
    name: '',
    description: '',
    attributes: [{ trait_type: '', value: '' }],
    collection: '',
    royaltyBps: 500, // 5%
    isSoulbound: false,
    equipmentSlots: [],
    initialXp: 0,
    customState: {},
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'media': return formData.resources.length > 0;
      case 'metadata': return formData.name.trim().length > 0;
      case 'config': return true;
      case 'review': return true;
      default: return false;
    }
  }, [currentStep, formData]);

  const nextStep = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
  };

  const prevStep = () => {
    const idx = currentStepIndex;
    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }],
    }));
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const addEquipmentSlot = () => {
    setFormData(prev => ({
      ...prev,
      equipmentSlots: [...prev.equipmentSlots, { name: '', requiredTrait: '', capacity: 1 }],
    }));
  };

  const removeEquipmentSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipmentSlots: prev.equipmentSlots.filter((_, i) => i !== index),
    }));
  };

  const handleMint = async () => {
    setMinting(true);
    setMintError(null);
    setUploadProgress(0);

    try {
      // 1. Upload all resources to IPFS
      const uploadedResources: Array<{
        type: string;
        uri: string;
        mimeType: string;
        priority: number;
        contextTags: string[];
      }> = [];

      for (let i = 0; i < formData.resources.length; i++) {
        const resource = formData.resources[i];
        setUploadProgress(Math.round(((i) / formData.resources.length) * 50));

        const result = await uploadToIPFS(resource.file, resource.name);
        if (!result.success || !result.uri) {
          throw new Error(`Failed to upload ${resource.name}: ${result.error}`);
        }

        uploadedResources.push({
          type: resource.type,
          uri: result.uri,
          mimeType: resource.file.type,
          priority: i,
          contextTags: [],
        });
      }

      setUploadProgress(60);

      // 2. Prepare mint payload
      const mintPayload = {
        name: formData.name,
        description: formData.description,
        resources: uploadedResources,
        attributes: formData.attributes.filter(a => a.trait_type && a.value),
        equipmentSlots: formData.equipmentSlots.filter(s => s.name),
        isSoulbound: formData.isSoulbound,
        royaltyBps: formData.royaltyBps,
        initialXp: formData.initialXp,
        customState: formData.customState,
        collection: formData.collection || undefined,
      };

      setUploadProgress(70);

      // 3. Call mint API
      const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mintPayload),
      });

      setUploadProgress(90);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Mint failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100);

      // 4. Call chain-mint to finalize on-chain
      if (result.tokenId) {
        await fetch('/api/nft/chain-mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId: result.tokenId }),
        });
      }

      onMintSuccess(result.tokenId || result.id);
    } catch (error: any) {
      setMintError(error.message || 'Minting failed. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
              className={`
                flex items-center gap-2 px-3 py-2 text-xs font-display tracking-wider w-full transition-all
                ${currentStep === step.id
                  ? 'bg-cyber/10 border border-cyber text-cyber'
                  : index < currentStepIndex
                    ? 'bg-steel/10 border border-steel-light/30 text-steel-light cursor-pointer'
                    : 'border border-ink-dim/10 text-ink-dim cursor-default'
                }
              `}
            >
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={`w-4 h-px flex-shrink-0 ${index < currentStepIndex ? 'bg-steel-light/50' : 'bg-ink-dim/20'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-panel p-6">
        {/* Step 1: Media Upload */}
        {currentStep === 'media' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-display text-white tracking-wider">UPLOAD MEDIA</h2>
              <p className="text-xs text-ink-muted font-body mt-1">
                Add images, audio, video, 3D models, or UE5 assets to your NFT
              </p>
            </div>
            <ResourceUploader
              resources={formData.resources}
              onChange={(resources) => setFormData(prev => ({ ...prev, resources }))}
            />
          </div>
        )}

        {/* Step 2: Metadata */}
        {currentStep === 'metadata' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-display text-white tracking-wider">METADATA</h2>
              <p className="text-xs text-ink-muted font-body mt-1">
                Define your asset&apos;s identity and attributes
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-display text-ink-muted tracking-wider block mb-1">NAME *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My DRC-369 Asset"
                  className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-display text-ink-muted tracking-wider block mb-1">DESCRIPTION</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your asset..."
                  rows={3}
                  className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-display text-ink-muted tracking-wider block mb-1">COLLECTION</label>
                <input
                  type="text"
                  value={formData.collection}
                  onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                  placeholder="Optional collection name"
                  className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Attributes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-display text-ink-muted tracking-wider">ATTRIBUTES</label>
                  <button
                    onClick={addAttribute}
                    className="text-[10px] text-cyber font-display tracking-wider hover:text-cyber-bright transition-colors"
                  >
                    + ADD
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.attributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={attr.trait_type}
                        onChange={(e) => {
                          const updated = [...formData.attributes];
                          updated[index] = { ...updated[index], trait_type: e.target.value };
                          setFormData(prev => ({ ...prev, attributes: updated }));
                        }}
                        placeholder="Trait type"
                        className="flex-1 bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => {
                          const updated = [...formData.attributes];
                          updated[index] = { ...updated[index], value: e.target.value };
                          setFormData(prev => ({ ...prev, attributes: updated }));
                        }}
                        placeholder="Value"
                        className="flex-1 bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white"
                      />
                      {formData.attributes.length > 1 && (
                        <button
                          onClick={() => removeAttribute(index)}
                          className="text-signal-error text-xs px-2 hover:bg-signal-error/10 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: DRC-369 Config */}
        {currentStep === 'config' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-display text-white tracking-wider">DRC-369 CONFIGURATION</h2>
              <p className="text-xs text-ink-muted font-body mt-1">
                Advanced settings for your on-chain asset
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-display text-ink-muted tracking-wider block mb-1">
                  ROYALTY ({(formData.royaltyBps / 100).toFixed(1)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={2500}
                  step={50}
                  value={formData.royaltyBps}
                  onChange={(e) => setFormData(prev => ({ ...prev, royaltyBps: Number(e.target.value) }))}
                  className="w-full accent-cyber"
                />
                <div className="flex justify-between text-[10px] font-mono text-ink-dim mt-1">
                  <span>0%</span>
                  <span>25%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-display text-ink-muted tracking-wider block mb-1">INITIAL XP</label>
                <input
                  type="number"
                  min={0}
                  value={formData.initialXp}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialXp: Number(e.target.value) }))}
                  className="w-full bg-architect-input border border-ink-dim/20 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            {/* Soulbound Toggle */}
            <div className="flex items-center gap-3 p-3 glass-panel">
              <button
                onClick={() => setFormData(prev => ({ ...prev, isSoulbound: !prev.isSoulbound }))}
                className={`
                  w-10 h-6 relative transition-colors duration-200
                  ${formData.isSoulbound ? 'bg-steel-light' : 'bg-ink-dim/30'}
                `}
              >
                <div className={`
                  absolute top-1 w-4 h-4 bg-white transition-all duration-200
                  ${formData.isSoulbound ? 'left-5' : 'left-1'}
                `} />
              </button>
              <div>
                <p className="text-xs text-white font-display tracking-wider">SOULBOUND</p>
                <p className="text-[10px] text-ink-muted font-body">
                  Non-transferable · Cannot be undone
                </p>
              </div>
            </div>

            {/* Equipment Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-display text-ink-muted tracking-wider">EQUIPMENT SLOTS</label>
                <button
                  onClick={addEquipmentSlot}
                  className="text-[10px] text-cyber font-display tracking-wider hover:text-cyber-bright transition-colors"
                >
                  + ADD SLOT
                </button>
              </div>
              {formData.equipmentSlots.length === 0 ? (
                <p className="text-[10px] text-ink-dim font-body p-3 border border-dashed border-ink-dim/20 text-center">
                  No equipment slots. Add slots to enable composable NFT nesting.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.equipmentSlots.map((slot, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => {
                          const updated = [...formData.equipmentSlots];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setFormData(prev => ({ ...prev, equipmentSlots: updated }));
                        }}
                        placeholder="Slot name (e.g. weapon)"
                        className="flex-1 bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={slot.requiredTrait}
                        onChange={(e) => {
                          const updated = [...formData.equipmentSlots];
                          updated[index] = { ...updated[index], requiredTrait: e.target.value };
                          setFormData(prev => ({ ...prev, equipmentSlots: updated }));
                        }}
                        placeholder="Required trait"
                        className="w-32 bg-architect-input border border-ink-dim/20 px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={() => removeEquipmentSlot(index)}
                        className="text-signal-error text-xs px-2 hover:bg-signal-error/10 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Mint */}
        {currentStep === 'review' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-display text-white tracking-wider">REVIEW & MINT</h2>
              <p className="text-xs text-ink-muted font-body mt-1">
                Confirm your DRC-369 asset details before minting
              </p>
            </div>

            {/* Preview Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="glass-panel p-4">
                  <p className="text-[10px] font-display text-ink-muted tracking-wider mb-1">NAME</p>
                  <p className="text-sm text-white font-body">{formData.name || 'Untitled'}</p>
                </div>
                {formData.description && (
                  <div className="glass-panel p-4">
                    <p className="text-[10px] font-display text-ink-muted tracking-wider mb-1">DESCRIPTION</p>
                    <p className="text-xs text-ink-body font-body">{formData.description}</p>
                  </div>
                )}
                <div className="glass-panel p-4">
                  <p className="text-[10px] font-display text-ink-muted tracking-wider mb-2">CONFIG</p>
                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-ink-body">Royalty: <span className="text-cyber">{(formData.royaltyBps / 100).toFixed(1)}%</span></p>
                    <p className="text-ink-body">Soulbound: <span className={formData.isSoulbound ? 'text-steel-light' : 'text-ink-dim'}>{formData.isSoulbound ? 'Yes' : 'No'}</span></p>
                    <p className="text-ink-body">Initial XP: <span className="text-cyber">{formData.initialXp}</span></p>
                    <p className="text-ink-body">Equipment Slots: <span className="text-ink-body">{formData.equipmentSlots.filter(s => s.name).length}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="glass-panel p-4">
                  <p className="text-[10px] font-display text-ink-muted tracking-wider mb-2">
                    RESOURCES ({formData.resources.length})
                  </p>
                  <div className="space-y-1">
                    {formData.resources.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-ink-dim">{i + 1}.</span>
                        <span className="text-ink-body truncate">{r.name}</span>
                        <span className="text-ink-dim ml-auto font-mono">{r.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.attributes.filter(a => a.trait_type && a.value).length > 0 && (
                  <div className="glass-panel p-4">
                    <p className="text-[10px] font-display text-ink-muted tracking-wider mb-2">ATTRIBUTES</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.attributes.filter(a => a.trait_type && a.value).map((attr, i) => (
                        <div key={i} className="px-2 py-1 bg-architect-surface border border-ink-dim/20">
                          <span className="text-[10px] text-ink-muted font-mono">{attr.trait_type}:</span>{' '}
                          <span className="text-[10px] text-white font-mono">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mint Progress */}
            {minting && (
              <div className="space-y-2">
                <div className="h-2 bg-architect-surface border border-ink-dim/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyber to-cyber-bright transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-cyber text-center">
                  {uploadProgress < 50 ? 'UPLOADING TO IPFS...' :
                   uploadProgress < 70 ? 'PREPARING MINT...' :
                   uploadProgress < 90 ? 'MINTING ON-CHAIN...' :
                   'FINALIZING...'}
                </p>
              </div>
            )}

            {/* Error */}
            {mintError && (
              <div className="p-3 border border-signal-error/30 bg-signal-error/5">
                <p className="text-xs text-signal-error font-mono">{mintError}</p>
              </div>
            )}

            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={minting}
              className={`
                w-full py-4 font-display text-sm tracking-wider transition-all
                ${minting
                  ? 'bg-ink-dim/20 border border-ink-dim/30 text-ink-dim cursor-wait'
                  : 'bg-cyber/10 border border-cyber text-cyber hover:bg-cyber hover:text-architect-bg'
                }
              `}
            >
              {minting ? 'MINTING...' : '⚡ MINT DRC-369 ASSET'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={`
            px-4 py-2 text-xs font-display tracking-wider border transition-colors
            ${currentStepIndex === 0
              ? 'border-ink-dim/10 text-ink-dim cursor-default'
              : 'border-ink-dim/30 text-ink-body hover:text-white hover:border-ink-body'
            }
          `}
        >
          ← BACK
        </button>
        {currentStep !== 'review' && (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`
              px-4 py-2 text-xs font-display tracking-wider border transition-colors
              ${canProceed()
                ? 'border-cyber text-cyber hover:bg-cyber hover:text-architect-bg'
                : 'border-ink-dim/10 text-ink-dim cursor-default'
              }
            `}
          >
            NEXT →
          </button>
        )}
      </div>
    </div>
  );
}
