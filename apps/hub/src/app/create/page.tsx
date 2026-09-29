'use client';

import { useState, useEffect } from 'react';
import { GalleryTab } from '@/components/create/GalleryTab';
import { MintTab } from '@/components/create/MintTab';
import { ManageTab } from '@/components/create/ManageTab';
import { CollectionsTab } from '@/components/create/CollectionsTab';
import { ViewerTab } from '@/components/create/ViewerTab';

const TABS = [
  { id: 'gallery', label: 'Gallery', icon: '🖼️', description: 'Browse & manage your NFTs' },
  { id: 'mint', label: 'Mint', icon: '⚡', description: 'Create new DRC-369 assets' },
  { id: 'manage', label: 'Manage', icon: '⚙️', description: 'XP, levels, resources & state' },
  { id: 'collections', label: 'Collections', icon: '📁', description: 'Organize your assets' },
  { id: 'viewer', label: 'Viewer', icon: '🔍', description: 'Full HD media viewer' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState<TabId>('gallery');
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);

  // Allow deep-linking via hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (TABS.some(t => t.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const handleViewNft = (nftId: string) => {
    setSelectedNftId(nftId);
    handleTabChange('viewer');
  };

  const handleManageNft = (nftId: string) => {
    setSelectedNftId(nftId);
    handleTabChange('manage');
  };

  return (
    <main className="min-h-screen pt-20 pb-24 px-4 md:px-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center bg-cyber/10 border border-cyber/30">
            <span className="text-cyber font-mono text-lg">⬡</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-wider">
              DRC-369 STUDIO
            </h1>
            <p className="text-ink-muted text-sm font-body">
              Create, manage, and explore your on-chain assets
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hidden pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-display text-xs tracking-wider
                transition-all duration-200 whitespace-nowrap border
                ${activeTab === tab.id
                  ? 'bg-cyber/10 border-cyber text-cyber shadow-cyber'
                  : 'bg-transparent border-transparent text-ink-muted hover:text-ink-body hover:border-ink-dim/30'
                }
              `}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="hidden md:inline text-[10px] text-ink-dim font-body tracking-normal">
                {tab.description}
              </span>
            </button>
          ))}
        </div>
        <div className="h-px bg-gradient-to-r from-cyber/40 via-steel/20 to-transparent" />
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'gallery' && (
          <GalleryTab
            onViewNft={handleViewNft}
            onManageNft={handleManageNft}
          />
        )}
        {activeTab === 'mint' && (
          <MintTab onMintSuccess={(nftId) => {
            setSelectedNftId(nftId);
            handleTabChange('gallery');
          }} />
        )}
        {activeTab === 'manage' && (
          <ManageTab
            selectedNftId={selectedNftId}
            onSelectNft={setSelectedNftId}
          />
        )}
        {activeTab === 'collections' && (
          <CollectionsTab onViewNft={handleViewNft} />
        )}
        {activeTab === 'viewer' && (
          <ViewerTab
            nftId={selectedNftId}
            onBack={() => handleTabChange('gallery')}
          />
        )}
      </div>
    </main>
  );
}
