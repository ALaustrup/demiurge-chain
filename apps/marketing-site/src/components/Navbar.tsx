'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/docs', label: 'Documentation' },
    { href: '/docs/getting-started', label: 'Getting Started' },
    { href: '/cgt', label: 'CGT Mining' },
    { href: '/blog', label: 'Chain News' },
    { href: '/forum', label: 'Forum' },
  ]

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-neon-cyan/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Sparkles className="w-8 h-8 text-neon-cyan group-hover:text-neon-magenta transition-colors" />
            <span className="text-2xl font-orbitron font-bold neon-text chroma-glow">
              DEMIURGE
            </span>
            <span className="text-sm font-orbitron text-neon-cyan/70">.GURU</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-neon-cyan border-b-2 border-neon-cyan'
                    : 'text-gray-300 hover:text-neon-cyan'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-neon-cyan"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'text-neon-cyan bg-neon-cyan/10'
                    : 'text-gray-300 hover:text-neon-cyan hover:bg-neon-cyan/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
