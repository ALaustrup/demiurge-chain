import Link from 'next/link'
import { BookOpen, Code, Gamepad2, Key, Database, Zap } from 'lucide-react'

const docSections = [
  {
    title: 'Getting Started',
    description: 'Set up your development environment and build your first game',
    href: '/docs/getting-started',
    icon: Zap,
    color: 'neon-cyan',
  },
  {
    title: 'Game Development',
    description: 'Complete guide to building games on Demiurge-Cloud',
    href: '/docs/game-development',
    icon: Gamepad2,
    color: 'neon-magenta',
  },
  {
    title: 'API Reference',
    description: 'Comprehensive API documentation for all blockchain methods',
    href: '/docs/api',
    icon: Code,
    color: 'neon-green',
  },
  {
    title: 'QOR ID',
    description: 'Learn about the QOR ID identity system and authentication',
    href: '/docs/qor-id',
    icon: Key,
    color: 'neon-purple',
  },
  {
    title: 'CGT Token',
    description: 'Understanding Creator God Token, mining, and tokenomics',
    href: '/docs/cgt',
    icon: Database,
    color: 'neon-pink',
  },
  {
    title: 'Architecture',
    description: 'Deep dive into the Demiurge-Cloud architecture',
    href: '/docs/architecture',
    icon: BookOpen,
    color: 'neon-yellow',
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text mb-6">
            Documentation
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Complete guides, tutorials, and API references for building on Demiurge-Cloud
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {docSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.title}
                href={section.href}
                className="glass-panel p-8 hover:scale-105 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-${section.color}/20 flex items-center justify-center mb-4 group-hover:bg-${section.color}/30 transition-colors`}>
                  <Icon className={`w-6 h-6 text-${section.color}`} />
                </div>
                <h3 className="text-xl font-orbitron font-bold text-white mb-2">{section.title}</h3>
                <p className="text-gray-400 text-sm">{section.description}</p>
              </Link>
            )
          })}
        </div>

        <div className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-orbitron font-bold text-neon-cyan mb-4">
            Need Help?
          </h2>
          <p className="text-gray-400 mb-6">
            Ask Sophia, our AI assistant, for help with any questions about the blockchain, development, or troubleshooting.
          </p>
          <p className="text-sm text-gray-500">
            Click the Sophia icon in the bottom right corner to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
