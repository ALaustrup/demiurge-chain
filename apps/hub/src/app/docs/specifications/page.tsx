'use client';

import Link from 'next/link';

const specifications = [
  {
    id: 'drc369',
    icon: '🎨',
    title: 'DRC-369: Dynamic NFTs',
    description: 'The Demiurge NFT standard with physics properties, composability, and autonomous behavior. Revolutionary approach to digital assets.',
    href: '/docs/specifications/drc369',
    status: 'Implemented',
    statusColor: 'bg-green-500/20 text-green-400',
    highlights: [
      '3D Physics Properties',
      'Composable Fusion',
      'Autonomy Engine',
      'Fractal Compression',
    ],
  },
  {
    id: 'cgt',
    icon: '💎',
    title: 'CGT Tokenomics',
    description: 'Complete token economics for Cognition Token (CGT). Distribution, staking mechanics, inflation model, and governance.',
    href: '/docs/specifications/cgt-tokenomics',
    status: 'Implemented',
    statusColor: 'bg-green-500/20 text-green-400',
    highlights: [
      '10B Total Supply',
      '3% Annual Inflation',
      'Era-Based Rewards',
      'Slashing Mechanics',
    ],
  },
  {
    id: 'cvp',
    icon: '🛡️',
    title: 'CVP: Consensus-Verified Polymorphism',
    description: 'Runtime security layer that validates code transformations at consensus level. Prevents malicious state changes.',
    href: '/docs/specifications/cvp',
    status: 'Implemented',
    statusColor: 'bg-green-500/20 text-green-400',
    highlights: [
      'Polymorphic Validation',
      'Threat Detection',
      'Automated Response',
      'Validator Coordination',
    ],
  },
  {
    id: 'qorid',
    icon: '🆔',
    title: 'QOR ID: Decentralized Identity',
    description: 'Self-sovereign identity system built on Demiurge. Secure authentication, profile management, and cross-dApp identity.',
    href: '/docs/specifications/qor-id',
    status: 'Implemented',
    statusColor: 'bg-green-500/20 text-green-400',
    highlights: [
      'Ed25519 Authentication',
      'On-Chain Profiles',
      'Badge System',
      'Recovery Options',
    ],
  },
  {
    id: 'energy',
    icon: '⚡',
    title: 'Energy System',
    description: 'Gasless transaction model using regenerating energy. Users stake CGT for energy allocation.',
    href: '/docs/specifications/energy',
    status: 'Implemented',
    statusColor: 'bg-green-500/20 text-green-400',
    highlights: [
      'Regenerating Energy',
      'Stake for Allocation',
      'Sponsorship Model',
      'Burst Protection',
    ],
  },
  {
    id: 'consensus',
    icon: '⚙️',
    title: 'Hybrid PoS + BFT Consensus',
    description: 'Combines Proof of Stake validator selection with Byzantine Fault Tolerant finality for security and speed.',
    href: '/docs/architecture/consensus',
    status: 'Implemented',
    statusColor: 'bg-green-500/20 text-green-400',
    highlights: [
      '6-Second Blocks',
      'Instant Finality',
      '100 Validators',
      'Delegated Staking',
    ],
  },
];

export default function SpecificationsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📋</span>
          <h1 className="text-3xl font-bold">Specifications</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Technical specifications and standards that define Demiurge-Cloud. 
          Deep dive into the architecture and design decisions.
        </p>
      </div>

      {/* Version Info */}
      <div className="flex items-center gap-4 text-sm">
        <div className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-white/10">
          <span className="text-gray-400">Protocol Version:</span>
          <span className="text-[var(--accent-primary)] ml-2">1.1.0</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-white/10">
          <span className="text-gray-400">Last Updated:</span>
          <span className="text-white ml-2">February 4, 2026</span>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="space-y-4">
        {specifications.map((spec) => (
          <Link key={spec.id} href={spec.href}>
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-all group">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="text-4xl">{spec.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-xl text-white group-hover:text-[var(--accent-primary)]">
                      {spec.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${spec.statusColor}`}>
                      {spec.status}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{spec.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {spec.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-400"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="hidden md:flex items-center text-gray-500">
                  →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Summary Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Protocol Parameters</h2>
        <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left text-gray-400">
                <th className="px-4 py-3">Parameter</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-4 py-3 text-white font-mono">block_time</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">6 seconds</td>
                <td className="px-4 py-3 text-gray-400">Target time between blocks</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white font-mono">era_length</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">14,400 blocks</td>
                <td className="px-4 py-3 text-gray-400">~24 hours per era</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white font-mono">max_validators</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">100</td>
                <td className="px-4 py-3 text-gray-400">Maximum active validators</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white font-mono">min_stake</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">10,000 CGT</td>
                <td className="px-4 py-3 text-gray-400">Minimum validator stake</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white font-mono">unbonding_period</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">7 eras</td>
                <td className="px-4 py-3 text-gray-400">~7 days to unstake</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white font-mono">inflation_rate</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">3% annual</td>
                <td className="px-4 py-3 text-gray-400">Yearly token emission</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white font-mono">slash_fraction</td>
                <td className="px-4 py-3 text-[var(--accent-primary)]">1-10%</td>
                <td className="px-4 py-3 text-gray-400">Penalty for misbehavior</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DRC Standards */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/10">
        <h3 className="font-semibold text-lg mb-4">Demiurge Request for Comments (DRC)</h3>
        <p className="text-gray-400 mb-4">
          DRC standards define interoperability requirements for the Demiurge ecosystem. 
          Implementing these standards ensures compatibility across the network.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-black/20 text-center">
            <div className="font-mono text-[var(--accent-primary)]">DRC-20</div>
            <div className="text-xs text-gray-400">Fungible Tokens</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 text-center">
            <div className="font-mono text-[var(--accent-primary)]">DRC-369</div>
            <div className="text-xs text-gray-400">Dynamic NFTs</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 text-center">
            <div className="font-mono text-[var(--accent-primary)]">DRC-420</div>
            <div className="text-xs text-gray-400">Session Keys</div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 text-center">
            <div className="font-mono text-[var(--accent-primary)]">DRC-721</div>
            <div className="text-xs text-gray-400">Simple NFTs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
