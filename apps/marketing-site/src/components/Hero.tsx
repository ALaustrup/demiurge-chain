import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-magenta/10 to-neon-green/10 opacity-50" />
      <div className="absolute inset-0 neon-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto text-center">
        <div className="mb-8 inline-flex items-center space-x-2 glass-panel px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-medium text-gray-300">Web-First Metaverse Operating System</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-orbitron font-bold mb-6 neon-text chroma-glow">
          DEMIURGE
          <span className="block text-3xl md:text-5xl mt-4 text-neon-cyan">BLOCKCHAIN</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 font-light">
          Build games, create NFTs, and mine Creator God Token (CGT) on the most advanced
          web-first blockchain platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/docs/getting-started"
            className="neon-button inline-flex items-center space-x-2 group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/docs"
            className="px-6 py-3 rounded-lg font-orbitron font-bold text-sm uppercase tracking-wider
                     border-2 border-neon-magenta text-neon-magenta
                     hover:bg-neon-magenta/10 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]
                     transition-all duration-300"
          >
            Documentation
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="glass-panel p-6">
            <div className="text-4xl font-orbitron font-bold text-neon-cyan mb-2">13B</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">CGT Supply</div>
          </div>
          <div className="glass-panel p-6">
            <div className="text-4xl font-orbitron font-bold text-neon-magenta mb-2">∞</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Games Possible</div>
          </div>
          <div className="glass-panel p-6">
            <div className="text-4xl font-orbitron font-bold text-neon-green mb-2">QOR</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Identity System</div>
          </div>
        </div>
      </div>
    </section>
  )
}
