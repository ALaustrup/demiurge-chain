'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/explorer', label: 'Overview', icon: '🏠' },
  { href: '/explorer/blocks', label: 'Blocks', icon: '📦' },
  { href: '/explorer/transactions', label: 'Transactions', icon: '💸' },
  { href: '/explorer/validators', label: 'Validators', icon: '⚡' },
  { href: '/explorer/analytics', label: 'Analytics', icon: '📊' },
];

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/explorer') {
      return pathname === '/explorer';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen">
      {/* Explorer Navigation */}
      <nav className="sticky top-0 z-40 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Title */}
            <Link href="/explorer" className="flex items-center gap-2">
              <span className="text-2xl">⛓️</span>
              <span className="font-grunge text-lg text-white hidden sm:block">
                Demiurge Explorer
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    isActive(item.href)
                      ? 'bg-neon-cyan/10 text-neon-cyan'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="glass-panel px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-sm"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  );
}
