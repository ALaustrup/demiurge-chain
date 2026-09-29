'use client';

import Link from 'next/link';

const layers = [
  {
    icon: '⚙️',
    title: 'Consensus Layer',
    description: 'Hybrid PoS + BFT consensus for fast finality and security. Validator selection, block production, and finalization.',
    href: '/docs/architecture/consensus',
    components: ['Block Producer', 'Finality Engine', 'Validator Set', 'Era Manager'],
  },
  {
    icon: '🌐',
    title: 'Network Layer',
    description: 'LibP2P-based peer-to-peer networking. Gossip protocols, peer discovery, and block propagation.',
    href: '/docs/architecture/network',
    components: ['Peer Discovery', 'Gossipsub', 'Block Sync', 'Transaction Pool'],
  },
  {
    icon: '📦',
    title: 'Runtime Modules',
    description: 'Modular runtime architecture. Core modules for balances, staking, NFTs, identity, and governance.',
    href: '/docs/architecture/modules',
    components: ['Balances', 'Staking', 'DRC-369', 'QOR ID', 'CVP'],
  },
  {
    icon: '💾',
    title: 'Storage Layer',
    description: 'Merkle Patricia Trie state storage with RocksDB backend. Efficient state proofs and history.',
    href: '/docs/architecture/storage',
    components: ['State Trie', 'Block Store', 'Transaction Index', 'Pruning'],
  },
  {
    icon: '📡',
    title: 'RPC Layer',
    description: 'JSON-RPC 2.0 API with WebSocket subscriptions. Query chain state and submit transactions.',
    href: '/docs/developers/rpc-reference',
    components: ['HTTP/WS Server', 'Methods', 'Subscriptions', 'Rate Limiting'],
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏗️</span>
          <h1 className="text-3xl font-bold">Architecture</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Technical architecture of Demiurge-Cloud. Understand how the layers work together
          to create a secure, scalable blockchain.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-6">
        <h3 className="font-semibold mb-4 text-center">System Architecture</h3>
        <div className="space-y-2">
          {/* Application Layer */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
            <div className="text-sm text-purple-400 mb-1">Application Layer</div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>Hub</span>
              <span>•</span>
              <span>dApps</span>
              <span>•</span>
              <span>Wallet</span>
              <span>•</span>
              <span>Games</span>
            </div>
          </div>
          
          {/* SDK Layer */}
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
            <div className="text-sm text-cyan-400 mb-1">SDK Layer</div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>TypeScript SDK</span>
              <span>•</span>
              <span>Unreal SDK</span>
              <span>•</span>
              <span>CLI</span>
            </div>
          </div>
          
          {/* RPC Layer */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
            <div className="text-sm text-blue-400 mb-1">RPC Layer</div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>JSON-RPC</span>
              <span>•</span>
              <span>WebSocket</span>
              <span>•</span>
              <span>Subscriptions</span>
            </div>
          </div>
          
          {/* Runtime Layer */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
            <div className="text-sm text-green-400 mb-1">Runtime Modules</div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-0.5 bg-black/20 rounded">Balances</span>
              <span className="px-2 py-0.5 bg-black/20 rounded">Staking</span>
              <span className="px-2 py-0.5 bg-black/20 rounded">DRC-369</span>
              <span className="px-2 py-0.5 bg-black/20 rounded">QOR ID</span>
              <span className="px-2 py-0.5 bg-black/20 rounded">CVP</span>
              <span className="px-2 py-0.5 bg-black/20 rounded">Energy</span>
            </div>
          </div>
          
          {/* Consensus Layer */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
            <div className="text-sm text-yellow-400 mb-1">Consensus Layer</div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>PoS Selection</span>
              <span>•</span>
              <span>BFT Finality</span>
              <span>•</span>
              <span>6s Blocks</span>
            </div>
          </div>
          
          {/* Network Layer */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
            <div className="text-sm text-orange-400 mb-1">Network Layer</div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>LibP2P</span>
              <span>•</span>
              <span>Gossipsub</span>
              <span>•</span>
              <span>Kademlia DHT</span>
            </div>
          </div>
          
          {/* Storage Layer */}
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
            <div className="text-sm text-red-400 mb-1">Storage Layer</div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>RocksDB</span>
              <span>•</span>
              <span>Merkle Trie</span>
              <span>•</span>
              <span>State Proofs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Layer Details</h2>
        <div className="space-y-4">
          {layers.map((layer) => (
            <Link key={layer.href} href={layer.href}>
              <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{layer.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-[var(--accent-primary)]">
                      {layer.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 mb-2">{layer.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.components.map((comp) => (
                        <span
                          key={comp}
                          className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-400"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-500">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-semibold text-white mb-1">6-Second Blocks</div>
          <div className="text-sm text-gray-400">Fast block production with instant finality</div>
        </div>
        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <div className="font-semibold text-white mb-1">CVP Security</div>
          <div className="text-sm text-gray-400">Runtime validation at consensus level</div>
        </div>
        <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 text-center">
          <div className="text-3xl mb-2">🧩</div>
          <div className="font-semibold text-white mb-1">Modular Design</div>
          <div className="text-sm text-gray-400">Upgradeable runtime without hard forks</div>
        </div>
      </div>
    </div>
  );
}
