import Link from 'next/link'
import { ArrowRight, BookOpen, Code, MessageSquare, Newspaper } from 'lucide-react'

const quickLinks = [
  {
    title: 'Documentation',
    description: 'Complete API references, guides, and tutorials',
    href: '/docs',
    icon: BookOpen,
    color: 'neon-cyan',
  },
  {
    title: 'Getting Started',
    description: 'Set up your development environment and build your first game',
    href: '/docs/getting-started',
    icon: Code,
    color: 'neon-magenta',
  },
  {
    title: 'Chain News',
    description: 'Latest updates, features, and announcements',
    href: '/blog',
    icon: Newspaper,
    color: 'neon-green',
  },
  {
    title: 'Community Forum',
    description: 'Connect with developers and creators',
    href: '/forum',
    icon: MessageSquare,
    color: 'neon-purple',
  },
]

export function QuickLinks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blockchain-darker">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold neon-text mb-4">
            Quick Links
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to get started with Demiurge-Cloud
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.title}
                href={link.href}
                className="glass-panel p-8 hover:scale-105 transition-all duration-300 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-${link.color}/20 flex items-center justify-center flex-shrink-0 group-hover:bg-${link.color}/30 transition-colors`}>
                    <Icon className={`w-6 h-6 text-${link.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-orbitron font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{link.description}</p>
                    <div className={`inline-flex items-center space-x-2 text-${link.color} text-sm font-medium group-hover:translate-x-2 transition-transform`}>
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
