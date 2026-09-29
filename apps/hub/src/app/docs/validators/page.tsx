'use client';

import Link from 'next/link';

const guides = [
  {
    icon: '🚀',
    title: 'Validator Quickstart',
    description: 'Get your validator node up and running. Hardware requirements, setup, and registration.',
    href: '/docs/validators/quickstart',
    time: '30 min',
  },
  {
    icon: '💰',
    title: 'Staking Guide',
    description: 'Stake CGT to validators, understand delegation, and maximize your rewards.',
    href: '/docs/validators/staking',
    time: '15 min',
  },
  {
    icon: '🔧',
    title: 'Operations Guide',
    description: 'Day-to-day validator operations: monitoring, updates, and maintenance.',
    href: '/docs/validators/operations',
    time: '20 min',
  },
];

const requirements = [
  { label: 'CPU', value: '8+ cores', note: 'Modern Intel/AMD' },
  { label: 'RAM', value: '32 GB', note: 'Minimum required' },
  { label: 'Storage', value: '500 GB NVMe', note: 'SSD required' },
  { label: 'Network', value: '100 Mbps', note: 'Low latency' },
  { label: 'Min Stake', value: '10,000 CGT', note: 'Self-stake' },
];

export default function ValidatorsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚡</span>
          <h1 className="text-3xl font-bold">Validators</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Run a validator node, stake CGT, and earn rewards while securing the Demiurge network.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Validators', value: '47' },
          { label: 'Total Staked', value: '2.4M CGT' },
          { label: 'Average APY', value: '12.3%' },
          { label: 'Era Length', value: '24 hours' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-white/10 text-center">
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Guides */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Validator Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <Link key={guide.href} href={guide.href}>
              <div className="h-full p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-all group">
                <div className="text-3xl mb-3">{guide.icon}</div>
                <h3 className="font-semibold text-white group-hover:text-[var(--accent-primary)] mb-1">
                  {guide.title}
                </h3>
                <p className="text-sm text-gray-400 mb-2">{guide.description}</p>
                <span className="text-xs text-gray-500">{guide.time}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Hardware Requirements</h2>
        <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left text-gray-400">
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Minimum</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requirements.map((req) => (
                <tr key={req.label}>
                  <td className="px-4 py-3 text-white">{req.label}</td>
                  <td className="px-4 py-3 text-[var(--accent-primary)] font-mono">{req.value}</td>
                  <td className="px-4 py-3 text-gray-400">{req.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Commands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="text-sm text-gray-400 mb-2">Register as Validator</div>
            <pre className="font-mono text-sm text-[var(--accent-primary)] overflow-x-auto">
              demiurge validator register --commission 5
            </pre>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="text-sm text-gray-400 mb-2">Stake CGT</div>
            <pre className="font-mono text-sm text-[var(--accent-primary)] overflow-x-auto">
              demiurge validator stake 10000
            </pre>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="text-sm text-gray-400 mb-2">Check Status</div>
            <pre className="font-mono text-sm text-[var(--accent-primary)] overflow-x-auto">
              demiurge validator status
            </pre>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="text-sm text-gray-400 mb-2">Claim Rewards</div>
            <pre className="font-mono text-sm text-[var(--accent-primary)] overflow-x-auto">
              demiurge validator claim-rewards
            </pre>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-white/10 text-center">
        <h3 className="text-xl font-semibold mb-2">Ready to Validate?</h3>
        <p className="text-gray-400 mb-4">
          Join the network and start earning rewards while securing Demiurge.
        </p>
        <Link href="/docs/validators/quickstart">
          <button className="px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-black font-medium hover:bg-[var(--accent-primary)]/80 transition-colors">
            Start Validator Setup →
          </button>
        </Link>
      </div>
    </div>
  );
}
