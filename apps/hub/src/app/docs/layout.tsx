'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Documentation navigation structure
const docsNavigation = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      { href: '/docs/getting-started', label: 'Overview' },
      { href: '/docs/getting-started/5-minute-quickstart', label: '5-Minute Quickstart' },
      { href: '/docs/getting-started/wallet-setup', label: 'Wallet Setup' },
      { href: '/docs/getting-started/first-transaction', label: 'First Transaction' },
    ],
  },
  {
    title: 'Developers',
    icon: '💻',
    items: [
      { href: '/docs/developers', label: 'Overview' },
      { href: '/docs/developers/complete-setup', label: 'Complete Setup Guide' },
      { href: '/docs/developers/rpc-reference', label: 'RPC Reference' },
      { href: '/docs/developers/validator-cli', label: 'Validator CLI' },
    ],
  },
  {
    title: 'SDK & Tools',
    icon: '🔧',
    items: [
      { href: '/docs/sdk', label: 'Overview' },
      { href: '/docs/sdk/typescript', label: 'TypeScript SDK' },
      { href: '/docs/sdk/wallet-extension', label: 'Wallet Extension' },
      { href: '/docs/sdk/unreal', label: 'Unreal Engine' },
    ],
  },
  {
    title: 'Validators',
    icon: '⚡',
    items: [
      { href: '/docs/validators', label: 'Overview' },
      { href: '/docs/validators/quickstart', label: 'Validator Quickstart' },
      { href: '/docs/validators/staking', label: 'Staking Guide' },
    ],
  },
  {
    title: 'Specifications',
    icon: '📋',
    items: [
      { href: '/docs/specifications', label: 'Overview' },
      { href: '/docs/specifications/drc369', label: 'DRC-369 NFTs' },
      { href: '/docs/specifications/cgt-tokenomics', label: 'CGT Tokenomics' },
      { href: '/docs/specifications/cvp', label: 'CVP Security' },
      { href: '/docs/specifications/qor-id', label: 'QOR ID' },
    ],
  },
  {
    title: 'Architecture',
    icon: '🏗️',
    items: [
      { href: '/docs/architecture', label: 'Overview' },
      { href: '/docs/architecture/consensus', label: 'Consensus' },
      { href: '/docs/architecture/network', label: 'Network Layer' },
      { href: '/docs/architecture/modules', label: 'Runtime Modules' },
    ],
  },
  {
    title: 'Deployment',
    icon: '🚢',
    items: [
      { href: '/docs/deployment', label: 'Overview' },
      { href: '/docs/deployment/production', label: 'Production Guide' },
      { href: '/docs/deployment/docker-testnet', label: 'Docker Testnet' },
      { href: '/docs/deployment/configuration', label: 'Configuration' },
    ],
  },
  {
    title: 'Troubleshooting',
    icon: '🔍',
    items: [
      { href: '/docs/troubleshooting', label: 'Common Issues' },
    ],
  },
];

function DocsSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    docsNavigation.map(section => section.title)
  );

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-20 left-0 h-[calc(100vh-5rem)] w-72 z-50
          bg-[var(--bg-surface)] border-r border-white/10
          transform transition-transform duration-300 ease-out
          overflow-y-auto scrollbar-thin
          lg:translate-x-0 lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Search Box */}
        <div className="p-4 border-b border-white/10">
          <Link href="/docs/search" className="block">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-white/10 text-gray-400 hover:border-[var(--accent-primary)]/50 transition-colors">
              <span>🔍</span>
              <span className="text-sm">Search documentation...</span>
              <span className="ml-auto text-xs opacity-50">⌘K</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {docsNavigation.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-white hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                <span className={`transform transition-transform ${expandedSections.includes(section.title) ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>

              {/* Section Items */}
              {expandedSections.includes(section.title) && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        block px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${isActive(item.href)
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>v1.1.0</span>
            <a 
              href="https://github.com/ALaustrup/demiurge-cloud" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-primary)]"
            >
              GitHub →
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const parts = pathname?.split('/').filter(Boolean) || [];
    const breadcrumbs = [{ href: '/docs', label: 'Docs' }];
    
    let currentPath = '';
    parts.slice(1).forEach((part) => {
      currentPath += `/${part}`;
      const label = part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ href: `/docs${currentPath}`, label });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-20 z-40 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <span className="text-xl">☰</span>
              <span className="text-sm">Menu</span>
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden lg:flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-600">/</span>}
                  <Link
                    href={crumb.href}
                    className={`hover:text-[var(--accent-primary)] ${
                      index === breadcrumbs.length - 1 ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/docs/search"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm"
              >
                🔍 <span className="hidden sm:inline">Search</span>
              </Link>
              <Link
                href="/"
                className="glass-panel px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-sm"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <DocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-[calc(100vh-8rem)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
