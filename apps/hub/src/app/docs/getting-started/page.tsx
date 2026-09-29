'use client';

import Link from 'next/link';

const guides = [
  {
    icon: '🚀',
    title: '5-Minute Quickstart',
    description: 'The fastest way to get started with Demiurge. Install the CLI, create a wallet, and make your first transaction.',
    href: '/docs/getting-started/5-minute-quickstart',
    time: '5 min',
    difficulty: 'Beginner',
  },
  {
    icon: '🔑',
    title: 'Wallet Setup',
    description: 'Install the browser extension wallet or set up a CLI wallet. Secure your keys and backup your recovery phrase.',
    href: '/docs/getting-started/wallet-setup',
    time: '10 min',
    difficulty: 'Beginner',
  },
  {
    icon: '💸',
    title: 'First Transaction',
    description: 'Send CGT tokens, check your balance, and understand transaction fees and confirmations.',
    href: '/docs/getting-started/first-transaction',
    time: '10 min',
    difficulty: 'Beginner',
  },
  {
    icon: '🌐',
    title: 'Testnet Quickstart',
    description: 'Connect to the testnet, get test tokens from the faucet, and experiment risk-free.',
    href: '/docs/getting-started/testnet-quickstart',
    time: '5 min',
    difficulty: 'Beginner',
  },
];

const nextSteps = [
  { icon: '💻', label: 'Build a dApp', href: '/docs/developers/dapp-quickstart' },
  { icon: '⚡', label: 'Run a Validator', href: '/docs/validators/quickstart' },
  { icon: '📘', label: 'Explore the SDK', href: '/docs/sdk/typescript' },
  { icon: '🎨', label: 'Create NFTs', href: '/docs/specifications/drc369' },
];

export default function GettingStartedPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🚀</span>
          <h1 className="text-3xl font-bold">Getting Started</h1>
        </div>
        <p className="text-gray-400 text-lg">
          New to Demiurge? These guides will help you go from zero to transacting on the network
          in just a few minutes.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-white/10">
        <h3 className="font-semibold mb-2">Prerequisites</h3>
        <ul className="text-gray-400 space-y-1 text-sm">
          <li>• A modern web browser (Chrome, Firefox, or Brave recommended)</li>
          <li>• Node.js 18+ (only for CLI and SDK development)</li>
          <li>• Basic familiarity with blockchain concepts (helpful but not required)</li>
        </ul>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide, index) => (
          <Link key={guide.href} href={guide.href}>
            <div className="h-full p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{guide.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-[var(--accent-primary)]">
                      Step {index + 1}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{guide.time}</span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{guide.description}</p>
                  <div className="mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs">
                      {guide.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* What's Next */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">What's Next?</h2>
        <p className="text-gray-400">
          Once you're comfortable with the basics, explore these topics:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nextSteps.map((step) => (
            <Link key={step.href} href={step.href}>
              <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-colors text-center">
                <div className="text-2xl mb-2">{step.icon}</div>
                <div className="text-sm text-gray-300">{step.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/10">
        <div>
          <h3 className="font-semibold">Need help?</h3>
          <p className="text-sm text-gray-400">Join our Discord community or ask Sophia</p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://discord.gg/demiurge"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
          >
            Discord
          </a>
          <button className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-black text-sm font-medium hover:bg-[var(--accent-primary)]/80 transition-colors">
            Ask Sophia
          </button>
        </div>
      </div>
    </div>
  );
}
