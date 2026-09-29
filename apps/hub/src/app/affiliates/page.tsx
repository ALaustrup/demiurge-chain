'use client';

import Link from 'next/link';

interface Affiliate {
  name: string;
  url: string;
  description?: string;
  type: 'affiliate' | 'sponsor';
}

const affiliates: Affiliate[] = [
  {
    name: 'Digital Sovereign Society',
    url: 'https://digitalsovereign.org',
    description: 'Building digital sovereignty for the decentralized future',
    type: 'affiliate',
  },
  {
    name: 'FractalNode',
    url: 'https://Fractalnode.ai',
    description: 'Advanced AI and blockchain solutions',
    type: 'sponsor',
  },
];

export default function AffiliatesPage() {
  const sponsors = affiliates.filter((a) => a.type === 'sponsor');
  const affiliateList = affiliates.filter((a) => a.type === 'affiliate');

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-grunge mb-4 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent chroma-glow">
            AFFILIATES & SPONSORS
          </h1>
          <p className="text-xl text-gray-300 font-body max-w-2xl mx-auto">
            Partners supporting the Demiurge ecosystem
          </p>
        </div>

        {/* Sponsors Section */}
        {sponsors.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-grunge-alt text-neon-magenta mb-8 chroma-glow">
              SPONSORS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map((sponsor, index) => (
                <Link
                  key={index}
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-magenta/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]">
                        ⭐
                      </div>
                      <h3 className="text-2xl font-grunge-alt text-neon-magenta mb-3 chroma-glow group-hover:text-neon-pink transition-colors">
                        {sponsor.name}
                      </h3>
                      {sponsor.description && (
                        <p className="text-gray-300 font-body text-sm mb-4">
                          {sponsor.description}
                        </p>
                      )}
                      <div className="mt-4 text-neon-pink group-hover:translate-x-2 transition-transform inline-block font-grunge-alt text-sm">
                        → VISIT
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Affiliates Section */}
        {affiliateList.length > 0 && (
          <section>
            <h2 className="text-3xl font-grunge-alt text-neon-cyan mb-8 chroma-glow">
              AFFILIATES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affiliateList.map((affiliate, index) => (
                <Link
                  key={index}
                  href={affiliate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">
                        🤝
                      </div>
                      <h3 className="text-2xl font-grunge-alt text-neon-cyan mb-3 chroma-glow group-hover:text-neon-green transition-colors">
                        {affiliate.name}
                      </h3>
                      {affiliate.description && (
                        <p className="text-gray-300 font-body text-sm mb-4">
                          {affiliate.description}
                        </p>
                      )}
                      <div className="mt-4 text-neon-green group-hover:translate-x-2 transition-transform inline-block font-grunge-alt text-sm">
                        → VISIT
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Home */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="neon-button px-8 py-3 inline-block"
          >
            ← BACK TO HOME
          </Link>
        </div>
      </div>
    </main>
  );
}
