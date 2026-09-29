import Link from 'next/link'
import { Coins, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react'

const miningMethods = [
  {
    title: 'Staking (Archon/Aeon)',
    description: 'Stake CGT as a validator or nominator to earn rewards',
    icon: TrendingUp,
    color: 'neon-cyan',
    details: [
      'Minimum stake: 100 CGT for nominators',
      'Minimum stake: 1,000,000 CGT for validators',
      'Annual yield: 6-15% depending on role',
      'Rewards distributed per era',
    ],
  },
  {
    title: 'Gameplay Mining',
    description: 'Earn CGT by playing games and completing quests',
    icon: Zap,
    color: 'neon-magenta',
    details: [
      'Complete in-game quests',
      'Build structures and create content',
      'Discover new areas',
      'Participate in events',
    ],
  },
  {
    title: 'Content Creation',
    description: 'Create art, music, and other content to earn CGT',
    icon: Users,
    color: 'neon-green',
    details: [
      'Submit original artwork',
      'Create music and sound effects',
      'Write documentation and guides',
      'Contribute to the ecosystem',
    ],
  },
]

export default function CGTPage() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Coins className="w-8 h-8 text-neon-magenta" />
            <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text">
              Creator God Token (CGT)
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            The divine currency powering the Demiurge ecosystem. Mine CGT through staking, gameplay, and content creation.
          </p>
        </div>

        {/* Token Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-orbitron font-bold text-neon-cyan mb-6">Token Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Supply</span>
                <span className="text-white font-bold">13,000,000,000 CGT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Precision</span>
                <span className="text-white font-bold">2 Decimals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Smallest Unit</span>
                <span className="text-white font-bold">1 Spark (0.01 CGT)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Conversion</span>
                <span className="text-white font-bold">100 Sparks = 1 CGT</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h2 className="text-2xl font-orbitron font-bold text-neon-magenta mb-6">Distribution</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pleroma Mining</span>
                <span className="text-white font-bold">40% (5.2B)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Archon Staking</span>
                <span className="text-white font-bold">20% (2.6B)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Demiurge Treasury</span>
                <span className="text-white font-bold">15% (1.95B)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Core Team</span>
                <span className="text-white font-bold">15% (1.95B)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Genesis Offering</span>
                <span className="text-white font-bold">10% (1.3B)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mining Methods */}
        <div className="mb-12">
          <h2 className="text-4xl font-orbitron font-bold neon-text mb-8 text-center">
            How to Mine CGT
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {miningMethods.map((method) => {
              const Icon = method.icon
              return (
                <div key={method.title} className="glass-panel p-8">
                  <div className={`w-12 h-12 rounded-lg bg-${method.color}/20 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 text-${method.color}`} />
                  </div>
                  <h3 className="text-xl font-orbitron font-bold text-white mb-2">{method.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{method.description}</p>
                  <ul className="space-y-2">
                    {method.details.map((detail, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <span className="text-neon-cyan mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-panel p-8 text-center">
          <h3 className="text-2xl font-orbitron font-bold text-neon-green mb-4">
            Ready to Start Mining?
          </h3>
          <p className="text-gray-400 mb-6">
            Get started by staking CGT, playing games, or creating content. Ask Sophia for detailed guidance!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/getting-started" className="neon-button inline-flex items-center space-x-2">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/docs/cgt" className="px-6 py-3 rounded-lg font-orbitron font-bold text-sm uppercase tracking-wider border-2 border-neon-magenta text-neon-magenta hover:bg-neon-magenta/10 transition-all">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
