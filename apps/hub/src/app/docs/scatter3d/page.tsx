'use client';

/**
 * Scatter3D Documentation Page
 * 
 * Comprehensive documentation for the Scatter3D engine architecture,
 * access protocol, and technical implementation.
 */

import Link from 'next/link';

export default function Scatter3DDocsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto font-mono">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-demiurge-cyan hover:text-demiurge-magenta transition-colors"
          >
            ← Return to Portal
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-demiurge-cyan mb-2">
          SCATTER3D // ENGINE ARCHITECTURE
        </h1>
        <p className="text-gray-400 mb-8">
          Only the staked may see the code behind the veil.
        </p>

        <div className="space-y-8">
          {/* Overview */}
          <section className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-demiurge-magenta mb-4">Overview</h2>
            <p className="text-gray-300 leading-relaxed">
              Scatter3D is a client-side rendering engine that translates standard 3D geometry
              into semantic character streams. It runs directly in the browser using WebGL for
              computation, but outputs purely alphanumeric visuals.
            </p>
          </section>

          {/* How It Works */}
          <section className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-demiurge-magenta mb-4">How It Works</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-demiurge-cyan mb-2">
                  1. The Geometry Pass
                </h3>
                <p>
                  The engine loads the world (Players, Terrain, Loot) as invisible math shapes.
                  Standard 3D models (GLTF/GLB) are processed but not rendered as pixels.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-demiurge-cyan mb-2">
                  2. The Raycaster
                </h3>
                <p>
                  For every pixel on your screen, the engine fires a ray into the 3D world.
                  It calculates depth, lighting, and surface normals.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-demiurge-cyan mb-2">
                  3. The Quantizer
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>If the ray hits nothing → Render <code className="text-demiurge-green">(Space)</code></li>
                  <li>If the ray hits a surface at an angle → Render <code className="text-demiurge-green">. or :</code> (Texture)</li>
                  <li>If the ray hits a surface head-on → Render <code className="text-demiurge-green"># or @</code> (Solid)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-demiurge-cyan mb-2">
                  4. The Colorizer
                </h3>
                <p>
                  The text character inherits the hex code of the object it represents.
                  For example, a "Ruby" item renders as a Red <code className="text-red-400">@</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Access Protocol */}
          <section className="glass-panel p-6 rounded-lg border border-red-500/30">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Protocol (QOR ID)</h2>
            <p className="text-gray-300 mb-4">
              Access to the Scatter3D runtime is restricted to High-Value Node Operators.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Authentication:</span>
                <span className="text-demiurge-cyan">Verified QOR ID Signature</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Proof of Stake:</span>
                <span className="text-demiurge-cyan">Minimum 100 CGT (10,000 smallest units)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stake Percentage:</span>
                <span className="text-demiurge-cyan">Minimum 0.01% of total assets</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4 italic">
              Required to initialize the render loop.
            </p>
          </section>

          {/* Technical Specs */}
          <section className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-demiurge-magenta mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Engine Version:</span>
                <span className="text-demiurge-cyan ml-2">1.0.0-alpha</span>
              </div>
              <div>
                <span className="text-gray-400">Rendering:</span>
                <span className="text-demiurge-cyan ml-2">ASCII Raymarching</span>
              </div>
              <div>
                <span className="text-gray-400">3D Library:</span>
                <span className="text-demiurge-cyan ml-2">React Three Fiber</span>
              </div>
              <div>
                <span className="text-gray-400">Character Set:</span>
                <span className="text-demiurge-cyan ml-2"> .:-+*=%@#</span>
              </div>
              <div>
                <span className="text-gray-400">Resolution:</span>
                <span className="text-demiurge-cyan ml-2">0.18 (configurable)</span>
              </div>
              <div>
                <span className="text-gray-400">Color Support:</span>
                <span className="text-demiurge-cyan ml-2">Full RGBA</span>
              </div>
            </div>
          </section>

          {/* Why This Matters */}
          <section className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-demiurge-magenta mb-4">Why This Matters for Demiurge</h2>
            <div className="space-y-3 text-gray-300">
              <div>
                <h3 className="font-semibold text-demiurge-cyan mb-1">Lightweight</h3>
                <p>
                  You are transmitting strings, not heavy textures. The client does the heavy lifting.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-demiurge-cyan mb-1">Obfuscation</h3>
                <p>
                  The "Scatter" effect acts as a visual encryption. You can hide easter eggs in the
                  code that only appear when a user is at a specific angle, visible only to those
                  who know where to look.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-demiurge-cyan mb-1">Exclusivity</h3>
                <p>
                  By requiring stake, we ensure only committed network participants can access
                  advanced rendering features. This creates value for stakers and protects
                  server resources.
                </p>
              </div>
            </div>
          </section>

          {/* Try It */}
          <section className="glass-panel p-6 rounded-lg border border-demiurge-cyan/30">
            <h2 className="text-2xl font-bold text-demiurge-cyan mb-4">Try Scatter3D</h2>
            <p className="text-gray-300 mb-4">
              If you meet the stake requirements, you can access the engine:
            </p>
            <Link
              href="/scatter3d"
              className="inline-block glass-panel px-6 py-3 rounded-lg hover:chroma-glow transition-all text-demiurge-cyan font-semibold"
            >
              LAUNCH SCATTER3D ENGINE →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
