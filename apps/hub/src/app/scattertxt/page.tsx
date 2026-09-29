'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useComingSoon } from '@/components/ComingSoonModal';

export default function ScatterTXTPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'create'>('overview');
  const { showComingSoon, ComingSoonModal } = useComingSoon();

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="glass-panel rounded-xl p-12 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-magenta/5 to-neon-green/10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl font-mono font-bold bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                ScatterTXT
              </div>
              <div className="glass-panel px-3 py-1 rounded text-xs text-neon-cyan">
                ENGINE v1.0.0
              </div>
            </div>
            
            <p className="text-xl text-gray-300 mb-6 max-w-2xl">
              The on-chain game engine powering the Demiurge metaverse. 
              Build immersive 3D experiences rendered entirely in ASCII characters.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href="/scatter3d"
                className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold py-3 px-8 rounded-lg hover:scale-105 transition-all"
              >
                LAUNCH DEMO
              </Link>
              <a
                href="https://github.com/ALaustrup/demiurge-cloud/blob/main/docs/scatter3d.md"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel border border-neon-cyan/50 text-neon-cyan font-bold py-3 px-8 rounded-lg hover:border-neon-cyan hover:chroma-glow transition-all"
              >
                DOCUMENTATION
              </a>
              {isAuthenticated && (
                <button
                  onClick={() => setActiveTab('create')}
                  className="glass-panel border border-neon-green/50 text-neon-green font-bold py-3 px-8 rounded-lg hover:border-neon-green transition-all"
                >
                  CREATE GAME
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {['overview', 'docs', 'create'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                activeTab === tab
                  ? 'bg-neon-cyan text-black'
                  : 'glass-panel text-gray-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Features */}
            <div className="glass-panel rounded-xl p-6">
              <div className="text-3xl mb-4">3D</div>
              <h3 className="text-xl font-bold text-white mb-2">ASCII Raymarching</h3>
              <p className="text-gray-400">
                Render complex 3D scenes using advanced raymarching techniques, 
                outputting to ASCII characters for a unique retro-futuristic aesthetic.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <div className="text-3xl mb-4">ON-CHAIN</div>
              <h3 className="text-xl font-bold text-white mb-2">Blockchain Native</h3>
              <p className="text-gray-400">
                Game state, assets, and progress are stored on the Demiurge blockchain. 
                True ownership of in-game items as DRC-369 NFTs.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <div className="text-3xl mb-4">EARN</div>
              <h3 className="text-xl font-bold text-white mb-2">Play-to-Earn</h3>
              <p className="text-gray-400">
                Earn Sparks and CGT tokens by playing games. 
                Achievements unlock rewards that have real value.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <div className="text-3xl mb-4">SDK</div>
              <h3 className="text-xl font-bold text-white mb-2">Developer SDK</h3>
              <p className="text-gray-400">
                Full TypeScript SDK for building games. 
                Easy integration with blockchain features, session keys, and asset management.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <div className="text-3xl mb-4">MULTI</div>
              <h3 className="text-xl font-bold text-white mb-2">Multiplayer Ready</h3>
              <p className="text-gray-400">
                Built-in support for multiplayer experiences. 
                Sync game state across players in real-time.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <div className="text-3xl mb-4">FREE</div>
              <h3 className="text-xl font-bold text-white mb-2">Free to Create</h3>
              <p className="text-gray-400">
                No upfront costs to build games. 
                Publish directly to the Demiurge ecosystem and earn from your creations.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="glass-panel rounded-xl p-8">
            <h2 className="text-2xl font-bold text-neon-cyan mb-6">Documentation</h2>
            
            <div className="space-y-4">
              <a
                href="https://github.com/ALaustrup/demiurge-cloud/blob/main/docs/scatter3d.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block glass-panel p-4 rounded-lg hover:chroma-glow transition-all"
              >
                <h3 className="text-lg font-bold text-white">Engine Architecture</h3>
                <p className="text-gray-400 text-sm">Learn how ScatterTXT renders 3D worlds in ASCII</p>
              </a>
              
              <Link
                href="/development"
                className="block glass-panel p-4 rounded-lg hover:chroma-glow transition-all"
              >
                <h3 className="text-lg font-bold text-white">Developer Guide</h3>
                <p className="text-gray-400 text-sm">Getting started with game development</p>
              </Link>
              
              <button
                onClick={() => showComingSoon('ScatterTXT API Reference', 'Complete API documentation for building 3D ASCII games with the ScatterTXT engine.')}
                className="w-full glass-panel p-4 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/5 transition-colors text-left"
              >
                <h3 className="text-lg font-bold text-yellow-400">API Reference</h3>
                <p className="text-gray-400 text-sm">Full API documentation - 🔔 Get notified</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="glass-panel rounded-xl p-8">
            <h2 className="text-2xl font-bold text-neon-green mb-6">Create a Game</h2>
            
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">Sign in with your QOR ID to create games</p>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold py-3 px-8 rounded-lg hover:scale-105 transition-all inline-block"
                >
                  SIGN IN
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-300">
                  Welcome, <span className="text-neon-cyan font-bold">{user?.qor_id}</span>! 
                  You can create games using the ScatterTXT engine.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-panel p-6 rounded-lg border border-neon-cyan/30">
                    <h3 className="text-lg font-bold text-neon-cyan mb-2">Quick Start Template</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Start with a pre-built template to quickly create your game
                    </p>
                    <button 
                      onClick={() => showComingSoon('Quick Start Templates', 'Pre-built game templates to jumpstart your ScatterTXT game development.')}
                      className="w-full glass-panel py-2 rounded hover:bg-neon-cyan/10 transition-all text-neon-cyan"
                    >
                      🔔 Get Notified
                    </button>
                  </div>
                  
                  <div className="glass-panel p-6 rounded-lg border border-neon-magenta/30">
                    <h3 className="text-lg font-bold text-neon-magenta mb-2">Custom Build</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Build from scratch with full control over your game
                    </p>
                    <button 
                      onClick={() => showComingSoon('Custom Game Builder', 'Full control game builder for creating unique ScatterTXT experiences from scratch.')}
                      className="w-full glass-panel py-2 rounded hover:bg-neon-magenta/10 transition-all text-neon-magenta"
                    >
                      🔔 Get Notified
                    </button>
                  </div>
                </div>
                
                <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
                  <p className="text-neon-green text-sm">
                    <strong>Creator Tip:</strong> Games you create can earn CGT when other players play them. 
                    The more engaging your game, the more you earn!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Engine Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neon-cyan">3</div>
              <div className="text-sm text-gray-400">Games Published</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-magenta">1.0K</div>
              <div className="text-sm text-gray-400">Total Plays</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-green">500</div>
              <div className="text-sm text-gray-400">CGT Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">ASCII</div>
              <div className="text-sm text-gray-400">Render Mode</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Coming Soon Modal */}
      <ComingSoonModal />
    </main>
  );
}
