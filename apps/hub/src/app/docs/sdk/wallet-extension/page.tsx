'use client';

export default function WalletExtensionPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧩</span>
          <h1 className="text-3xl font-bold">Demiurge Browser Extension</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Your gateway to the Demiurge ecosystem — wallet, Sophia AI, and content capture — right in your browser.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: '🔐', title: 'Secure Wallet', desc: 'Ed25519 keypairs with AES-256-GCM encryption, BIP39 mnemonics, and dApp provider API.' },
          { icon: '🆔', title: 'QOR ID Login', desc: 'Authenticate with your QOR ID or sign a challenge with your keypair — no separate passwords.' },
          { icon: '🧠', title: 'Sophia AI Sidebar', desc: 'Ask Sophia questions about the current page, your wallet, the chain — she rides along everywhere.' },
          { icon: '📝', title: 'Content Capture', desc: 'Save notes, links, and images from any page. Mint page summaries as DRC-369 NFTs on-chain.' },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl bg-[var(--bg-surface)] border border-white/10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Install Instructions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Install (Developer Sideload)</h2>
        <p className="text-gray-400 text-sm">
          The extension is currently in beta and not yet published on the Chrome Web Store.
          Follow these steps to install it manually.
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-2">Clone and Build</h3>
                <pre className="bg-black/30 rounded-lg p-3 font-mono text-sm text-gray-300 overflow-x-auto">
{`git clone https://github.com/ALaustrup/demiurge-cloud.git
cd Demiurge-Cloud/apps/wallet-extension
npm install
npm run build`}
                </pre>
                <p className="text-gray-400 text-xs mt-2">
                  This produces a <code className="text-[var(--accent-primary)]">dist/</code> folder with the compiled extension.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center font-bold text-sm">2</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-2">Load in Chrome</h3>
                <ol className="list-decimal list-inside text-gray-300 text-sm space-y-1">
                  <li>Open <code className="text-[var(--accent-primary)]">chrome://extensions</code></li>
                  <li>Enable <strong>Developer mode</strong> (top-right toggle)</li>
                  <li>Click <strong>Load unpacked</strong></li>
                  <li>Select the <code className="text-[var(--accent-primary)]">dist/</code> folder you just built</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center font-bold text-sm">3</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-2">Pin and Use</h3>
                <p className="text-gray-300 text-sm">
                  Click the puzzle-piece icon in Chrome&apos;s toolbar and pin <strong>Demiurge Wallet</strong>.
                  Click the icon to open the popup, or use the side panel for Sophia AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* dApp Integration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">dApp Integration</h2>
        <p className="text-gray-400 text-sm mb-4">
          The extension injects a <code className="text-[var(--accent-primary)]">window.demiurge</code> provider on every page.
          Use it to connect, sign transactions, and query balances.
        </p>
        <pre className="bg-black/30 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
{`// Request wallet connection
const accounts = await window.demiurge.request({
  method: 'demiurge_requestAccounts',
});

// Send a transaction
const hash = await window.demiurge.request({
  method: 'demiurge_sendTransaction',
  params: [{ to: 'recipient_address', value: '1000000000000000000' }],
});

// Sign a message
const sig = await window.demiurge.request({
  method: 'demiurge_signMessage',
  params: ['Hello Demiurge!'],
});`}
        </pre>
      </div>

      {/* Back link */}
      <div>
        <a href="/docs/sdk" className="text-[var(--accent-primary)] hover:underline text-sm">
          ← Back to SDK &amp; Tools
        </a>
      </div>
    </div>
  );
}
