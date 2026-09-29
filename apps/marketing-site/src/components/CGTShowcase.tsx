import Link from 'next/link'
import { Coins, TrendingUp, Users, Zap } from 'lucide-react'

export function CGTShowcase() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-magenta/10 via-neon-cyan/10 to-neon-green/10" />
      
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Coins className="w-6 h-6 text-neon-magenta" />
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold neon-text">
              Creator God Token (CGT)
            </h2>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            The divine currency powering the Demiurge ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Tokenomics */}
          <div className="glass-panel p-8">
            <h3 className="text-2xl font-orbitron font-bold text-neon-cyan mb-6">Tokenomics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Supply</span>
                <span className="text-white font-bold">13,000,000,000 CGT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Precision</span>
                <span className="text-white font-bold">2 Decimals</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Smallest Unit</span>
                <span className="text-white font-bold">1 Spark (0.01 CGT)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Conversion</span>
                <span className="text-white font-bold">100 Sparks = 1 CGT</span>
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className="glass-panel p-8">
            <h3 className="text-2xl font-orbitron font-bold text-neon-magenta mb-6">Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-cyan rounded-full" />
                  <span className="text-gray-400">Pleroma Mining</span>
                </div>
                <span className="text-white font-bold">40% (5.2B)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-magenta rounded-full" />
                  <span className="text-gray-400">Archon Staking</span>
                </div>
                <span className="text-white font-bold">20% (2.6B)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-green rounded-full" />
                  <span className="text-gray-400">Demiurge Treasury</span>
                </div>
                <span className="text-white font-bold">15% (1.95B)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-purple rounded-full" />
                  <span className="text-gray-400">Core Team</span>
                </div>
                <span className="text-white font-bold">15% (1.95B)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-neon-yellow rounded-full" />
                  <span className="text-gray-400">Genesis Offering</span>
                </div>
                <span className="text-white font-bold">10% (1.3B)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mining Methods */}
        <div className="glass-panel p-8 mb-8">
          <h3 className="text-2xl font-orbitron font-bold text-neon-green mb-6 flex items-center space-x-2">
            <Zap className="w-6 h-6" />
            <span>How to Mine CGT</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blockchain-dark rounded-lg">
              <TrendingUp className="w-8 h-8 text-neon-cyan mb-3" />
              <h4 className="font-orbitron font-bold text-white mb-2">Staking</h4>
              <p className="text-gray-400 text-sm">
                Stake CGT as a validator (Archon) or nominator (Aeon) to earn rewards
              </p>
            </div>
            <div className="p-6 bg-blockchain-dark rounded-lg">
              <Users className="w-8 h-8 text-neon-magenta mb-3" />
              <h4 className="font-orbitron font-bold text-white mb-2">Gameplay</h4>
              <p className="text-gray-400 text-sm">
                Play games, complete quests, and create content to earn CGT rewards
              </p>
            </div>
            <div className="p-6 bg-blockchain-dark rounded-lg">
              <Coins className="w-8 h-8 text-neon-green mb-3" />
              <h4 className="font-orbitron font-bold text-white mb-2">Content Creation</h4>
              <p className="text-gray-400 text-sm">
                Build structures, create art, and contribute to the ecosystem
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/cgt"
            className="neon-button inline-flex items-center space-x-2"
          >
            <span>Learn More About CGT Mining</span>
            <Coins className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
