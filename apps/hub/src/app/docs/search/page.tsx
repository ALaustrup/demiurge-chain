'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  title: string;
  description: string;
  href: string;
  category: string;
  icon: string;
  relevance: number;
}

// Static search index - in production, this would be generated from docs
const searchIndex: SearchResult[] = [
  // Getting Started
  { title: '5-Minute Quickstart', description: 'Get running with Demiurge in under 5 minutes', href: '/docs/getting-started/5-minute-quickstart', category: 'Getting Started', icon: '🚀', relevance: 100 },
  { title: 'Wallet Setup', description: 'Install the browser extension and create your wallet', href: '/docs/getting-started/wallet-setup', category: 'Getting Started', icon: '🔑', relevance: 95 },
  { title: 'First Transaction', description: 'Send your first CGT transfer on the network', href: '/docs/getting-started/first-transaction', category: 'Getting Started', icon: '💸', relevance: 90 },
  { title: 'Installation Guide', description: 'Complete installation guide for all components', href: '/docs/getting-started/installation', category: 'Getting Started', icon: '📥', relevance: 85 },
  
  // Developers
  { title: 'Complete Setup Guide', description: 'Full development environment setup from scratch', href: '/docs/developers/complete-setup', category: 'Developers', icon: '💻', relevance: 100 },
  { title: 'RPC Reference', description: 'Complete JSON-RPC 2.0 API documentation', href: '/docs/developers/rpc-reference', category: 'Developers', icon: '📡', relevance: 98 },
  { title: 'Validator CLI', description: 'Command-line tools for validator operations', href: '/docs/developers/validator-cli', category: 'Developers', icon: '⌨️', relevance: 85 },
  { title: 'dApp Quickstart', description: 'Build your first Demiurge-integrated application', href: '/docs/developers/dapp-quickstart', category: 'Developers', icon: '🌐', relevance: 92 },
  { title: 'WebSocket Subscriptions', description: 'Real-time blockchain event streaming', href: '/docs/developers/rpc-reference#websocket', category: 'Developers', icon: '🔌', relevance: 80 },
  
  // SDK
  { title: 'TypeScript SDK', description: 'Complete @demiurge/sdk reference and examples', href: '/docs/sdk/typescript', category: 'SDK & Tools', icon: '📘', relevance: 100 },
  { title: 'Wallet Extension', description: 'Browser wallet development and dApp integration', href: '/docs/sdk/wallet-extension', category: 'SDK & Tools', icon: '🔐', relevance: 95 },
  { title: 'Unreal Engine SDK', description: 'Integrate Demiurge into Unreal Engine projects', href: '/docs/sdk/unreal', category: 'SDK & Tools', icon: '🎮', relevance: 85 },
  { title: 'Unity Integration', description: 'Unity game engine integration guide', href: '/docs/sdk/unity', category: 'SDK & Tools', icon: '🎯', relevance: 85 },
  
  // Validators
  { title: 'Validator Quickstart', description: 'Become a validator and start earning rewards', href: '/docs/validators/quickstart', category: 'Validators', icon: '⚡', relevance: 100 },
  { title: 'Staking Guide', description: 'Stake CGT to validators and earn rewards', href: '/docs/validators/staking', category: 'Validators', icon: '💰', relevance: 90 },
  { title: 'Validator Operations', description: 'Day-to-day validator management', href: '/docs/validators/operations', category: 'Validators', icon: '🔧', relevance: 80 },
  
  // Specifications
  { title: 'DRC-369 NFT Standard', description: 'Dynamic NFTs with physics and composability', href: '/docs/specifications/drc369', category: 'Specifications', icon: '🎨', relevance: 100 },
  { title: 'CGT Tokenomics', description: 'Token economics and distribution', href: '/docs/specifications/cgt-tokenomics', category: 'Specifications', icon: '💎', relevance: 95 },
  { title: 'CVP Security', description: 'Consensus-Verified Polymorphism for runtime security', href: '/docs/specifications/cvp', category: 'Specifications', icon: '🛡️', relevance: 90 },
  { title: 'QOR ID', description: 'Decentralized identity specification', href: '/docs/specifications/qor-id', category: 'Specifications', icon: '🆔', relevance: 85 },
  
  // Architecture
  { title: 'Architecture Overview', description: 'System architecture and design principles', href: '/docs/architecture', category: 'Architecture', icon: '🏗️', relevance: 100 },
  { title: 'Consensus Mechanism', description: 'Hybrid PoS + BFT consensus design', href: '/docs/architecture/consensus', category: 'Architecture', icon: '⚙️', relevance: 95 },
  { title: 'Network Layer', description: 'LibP2P networking and peer discovery', href: '/docs/architecture/network', category: 'Architecture', icon: '🌐', relevance: 85 },
  
  // Deployment
  { title: 'Docker Testnet', description: '4-node testnet with Docker Compose', href: '/docs/deployment/docker-testnet', category: 'Deployment', icon: '🐳', relevance: 100 },
  { title: 'Production Deployment', description: 'Deploy to production servers', href: '/docs/deployment/production', category: 'Deployment', icon: '🚀', relevance: 95 },
  { title: 'Configuration Reference', description: 'All configuration options explained', href: '/docs/deployment/configuration', category: 'Deployment', icon: '⚙️', relevance: 90 },
  { title: 'Environment Variables', description: 'Complete environment variable reference', href: '/docs/deployment/environment', category: 'Deployment', icon: '📝', relevance: 85 },
  
  // Troubleshooting
  { title: 'Common Issues', description: 'Solutions to frequently encountered problems', href: '/docs/troubleshooting', category: 'Troubleshooting', icon: '🔍', relevance: 100 },
];

export default function DocsSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Search function
  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    const words = normalizedQuery.split(' ').filter(Boolean);

    const scored = searchIndex.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const categoryLower = item.category.toLowerCase();

      // Exact title match (highest priority)
      if (titleLower === normalizedQuery) score += 1000;
      
      // Title contains query
      if (titleLower.includes(normalizedQuery)) score += 500;
      
      // Word matches
      words.forEach(word => {
        if (titleLower.includes(word)) score += 100;
        if (descLower.includes(word)) score += 50;
        if (categoryLower.includes(word)) score += 30;
      });

      // Boost by base relevance
      score += item.relevance;

      return { ...item, score };
    });

    const filtered = scored
      .filter(item => item.score > item.relevance)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setResults(filtered);
    setSelectedIndex(0);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].href);
      } else if (e.key === 'Escape') {
        setQuery('');
        setResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, router]);

  // Popular searches when no query
  const popularSearches = [
    { label: 'Quick Start', query: 'quickstart' },
    { label: 'TypeScript SDK', query: 'typescript sdk' },
    { label: 'RPC Reference', query: 'rpc' },
    { label: 'Wallet Extension', query: 'wallet' },
    { label: 'DRC-369', query: 'drc-369' },
    { label: 'Docker', query: 'docker' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Search Documentation</h1>
        <p className="text-gray-400">Find guides, references, and specifications</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-[var(--bg-surface)] border border-white/20 focus-within:border-[var(--accent-primary)] transition-colors">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for guides, APIs, specifications..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results or Popular Searches */}
      {results.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-gray-500 px-2">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 overflow-hidden">
            {results.map((result, index) => (
              <Link key={result.href} href={result.href}>
                <div
                  className={`
                    p-4 border-b border-white/5 last:border-0 transition-colors
                    ${index === selectedIndex ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-white/5'}
                  `}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {result.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {result.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate mt-0.5">
                        {result.description}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm">↵</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : query ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>No results found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or browse categories</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Popular Searches */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Popular searches</div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <button
                  key={item.query}
                  onClick={() => setQuery(item.query)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-white/10 text-sm text-gray-300 hover:border-[var(--accent-primary)]/50 hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Browse Categories */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Browse by category</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '🚀', label: 'Getting Started', href: '/docs/getting-started' },
                { icon: '💻', label: 'Developers', href: '/docs/developers' },
                { icon: '🔧', label: 'SDK & Tools', href: '/docs/sdk' },
                { icon: '⚡', label: 'Validators', href: '/docs/validators' },
                { icon: '📋', label: 'Specifications', href: '/docs/specifications' },
                { icon: '🏗️', label: 'Architecture', href: '/docs/architecture' },
              ].map((cat) => (
                <Link key={cat.href} href={cat.href}>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-surface)] border border-white/10 hover:border-[var(--accent-primary)]/50 transition-colors">
                    <span>{cat.icon}</span>
                    <span className="text-sm text-gray-300">{cat.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="flex justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-white/5">↑↓</span>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-white/5">↵</span>
          <span>Select</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-white/5">Esc</span>
          <span>Clear</span>
        </div>
      </div>
    </div>
  );
}
