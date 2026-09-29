'use client';

import Link from 'next/link';

const quickStartCards = [
  {
    icon: '🚀',
    title: '5-Minute Quickstart',
    description: 'Get running with Demiurge in under 5 minutes',
    href: '/docs/getting-started/5-minute-quickstart',
    color: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    icon: '🔑',
    title: 'Wallet Setup',
    description: 'Install the browser extension and create your wallet',
    href: '/docs/getting-started/wallet-setup',
    color: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: '💻',
    title: 'Build a dApp',
    description: 'Integrate Demiurge into your application',
    href: '/docs/developers/dapp-quickstart',
    color: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: '⚡',
    title: 'Run a Validator',
    description: 'Stake CGT and earn rewards as a validator',
    href: '/docs/validators/quickstart',
    color: 'from-yellow-500/20 to-orange-500/20',
  },
];

const categoryCards = [
  {
    icon: '📚',
    title: 'Getting Started',
    description: 'New to Demiurge? Start here with our beginner guides.',
    href: '/docs/getting-started',
    links: ['Quick Start', 'Wallet Setup', 'First Transaction'],
  },
  {
    icon: '🔧',
    title: 'SDK & Tools',
    description: 'TypeScript SDK, CLI tools, and game engine integrations.',
    href: '/docs/sdk',
    links: ['TypeScript SDK', 'Wallet Extension', 'Unreal Engine'],
  },
  {
    icon: '📋',
    title: 'Specifications',
    description: 'Deep dive into DRC-369, CGT tokenomics, and CVP security.',
    href: '/docs/specifications',
    links: ['DRC-369 NFTs', 'CGT Tokenomics', 'CVP Security'],
  },
  {
    icon: '🏗️',
    title: 'Architecture',
    description: 'Understand the technical architecture and design decisions.',
    href: '/docs/architecture',
    links: ['Consensus', 'Network Layer', 'Runtime Modules'],
  },
  {
    icon: '🚢',
    title: 'Deployment',
    description: 'Deploy nodes, testnets, and production infrastructure.',
    href: '/docs/deployment',
    links: ['Production Guide', 'Docker Testnet', 'Configuration'],
  },
  {
    icon: '🔍',
    title: 'Troubleshooting',
    description: 'Solutions to common issues and debugging guides.',
    href: '/docs/troubleshooting',
    links: ['Common Issues', 'Node Problems', 'RPC Errors'],
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Demiurge <span className="text-[var(--accent-primary)]">Documentation</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Everything you need to build on Demiurge-Cloud. 
          From quick starts to deep technical specifications.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <Link href="/docs/search">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer group">
            <span className="text-xl">🔍</span>
            <span className="text-gray-400 group-hover:text-gray-300">
              Search documentation...
            </span>
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
              <span className="px-1.5 py-0.5 rounded bg-white/5">⌘</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5">K</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Start Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStartCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className={`
                h-full p-5 rounded-xl bg-gradient-to-br ${card.color}
                border border-white/10 hover:border-[var(--accent-primary)]/50
                transition-all duration-300 hover:scale-[1.02] group
              `}>
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-[var(--accent-primary)]">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Explore by Topic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="h-full p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{card.icon}</span>
                  <h3 className="font-semibold text-white group-hover:text-[var(--accent-primary)]">
                    {card.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">{card.description}</p>
                <div className="flex flex-wrap gap-2">
                  {card.links.map((link) => (
                    <span
                      key={link}
                      className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-400"
                    >
                      {link}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ask Sophia CTA */}
      <div className="text-center p-8 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/10">
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-xl font-semibold mb-2">
          Can't find what you're looking for?
        </h2>
        <p className="text-gray-400 mb-4">
          Ask Sophia, our AI assistant, for help navigating the documentation.
        </p>
        <button className="px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-black font-medium hover:bg-[var(--accent-primary)]/80 transition-colors">
          Ask Sophia
        </button>
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
        <a 
          href="https://github.com/ALaustrup/demiurge-cloud" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-4 rounded-lg bg-[var(--bg-surface)] hover:bg-white/5 transition-colors"
        >
          <div className="text-xl mb-1">📦</div>
          <div className="text-gray-400">GitHub</div>
        </a>
        <Link href="/developers" className="p-4 rounded-lg bg-[var(--bg-surface)] hover:bg-white/5 transition-colors">
          <div className="text-xl mb-1">🔗</div>
          <div className="text-gray-400">API Reference</div>
        </Link>
        <Link href="/explorer" className="p-4 rounded-lg bg-[var(--bg-surface)] hover:bg-white/5 transition-colors">
          <div className="text-xl mb-1">🔍</div>
          <div className="text-gray-400">Block Explorer</div>
        </Link>
        <a 
          href="https://discord.gg/demiurge" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-4 rounded-lg bg-[var(--bg-surface)] hover:bg-white/5 transition-colors"
        >
          <div className="text-xl mb-1">💬</div>
          <div className="text-gray-400">Discord</div>
        </a>
      </div>
    </div>
  );
}
