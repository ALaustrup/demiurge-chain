import Link from 'next/link'
import { Gamepad2, Coins, BookOpen, Users, Code, Zap } from 'lucide-react'

const features = [
  {
    icon: Gamepad2,
    title: 'Game Development',
    description: 'Build and deploy games directly on-chain with our comprehensive SDK and tools.',
    href: '/docs/getting-started',
    color: 'neon-cyan',
  },
  {
    icon: Coins,
    title: 'CGT Mining',
    description: 'Mine Creator God Token through gameplay, staking, and content creation.',
    href: '/cgt',
    color: 'neon-magenta',
  },
  {
    icon: BookOpen,
    title: 'Complete Documentation',
    description: 'Comprehensive guides, API references, and tutorials for developers.',
    href: '/docs',
    color: 'neon-green',
  },
  {
    icon: Users,
    title: 'Community Forum',
    description: 'Connect with developers, creators, and validators in our active community.',
    href: '/forum',
    color: 'neon-purple',
  },
  {
    icon: Code,
    title: 'Developer Tools',
    description: 'Powerful CLI tools, SDKs, and integrations for seamless development.',
    href: '/docs/developer-tools',
    color: 'neon-pink',
  },
  {
    icon: Zap,
    title: 'Chain News',
    description: 'Stay updated with the latest blockchain updates, features, and announcements.',
    href: '/blog',
    color: 'neon-yellow',
  },
]

export function Features() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blockchain-darker">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold neon-text mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A complete ecosystem for building, deploying, and monetizing blockchain games
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="glass-panel p-8 hover:scale-105 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-${feature.color}/20 flex items-center justify-center mb-4 group-hover:bg-${feature.color}/30 transition-colors`}>
                  <Icon className={`w-6 h-6 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-orbitron font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                <div className={`mt-4 text-${feature.color} text-sm font-medium group-hover:translate-x-2 transition-transform inline-block`}>
                  Learn more →
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
