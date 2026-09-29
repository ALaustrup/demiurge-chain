'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SophiaChatPanel } from '@/components/sophia';

const capabilities = [
  {
    icon: '📚',
    title: 'Documentation & Onboarding',
    description: 'Interactive step-by-step guides for users, developers, and validators. Sophia walks you through everything from wallet creation to agent deployment.',
    example: '"I\'m new here, help me get started"',
  },
  {
    icon: '🔍',
    title: 'Blockchain Queries',
    description: 'Check balances, look up transactions, get block info, and monitor validators in real-time using live RPC data.',
    example: '"What\'s the latest block?"',
  },
  {
    icon: '📜',
    title: 'Gnostic Wisdom',
    description: 'Explore the Gnostic theology behind every system name. Learn about Sophia, the Demiurge, Archons, Aeons, the Pleroma, and more.',
    example: '"Why is it called Demiurge?"',
  },
  {
    icon: '🎨',
    title: 'DRC-369 NFT Minting',
    description: 'Mint dynamic NFTs directly through conversation. Sophia can create achievement NFTs, commemorative tokens, and her own memory artifacts.',
    example: '"Mint me an achievement NFT"',
  },
  {
    icon: '🔧',
    title: 'Troubleshooting Engine',
    description: 'Guided diagnostic flows for failed transactions, connection issues, missing NFTs, staking rewards, and wallet problems.',
    example: '"My transaction failed, help me debug it"',
  },
  {
    icon: '🤖',
    title: 'Agent Deployment',
    description: 'Deploy AI agents to the Demiurge network with an interactive wizard. Configure capabilities, autonomy, and spending limits.',
    example: '"Help me deploy an AI agent"',
  },
  {
    icon: '⚡',
    title: 'Staking & Rewards',
    description: 'Get detailed validator information, staking status, pending rewards, and commission impact analysis.',
    example: '"How do I stake CGT?"',
  },
  {
    icon: '🏛️',
    title: 'Governance',
    description: 'Summarize governance proposals, understand voting implications, and analyze validator commission changes.',
    example: '"Show me governance proposals"',
  },
  {
    icon: '🗣️',
    title: 'Voice Mode',
    description: 'Talk to Sophia directly using your microphone. Uses the Grok Voice API or browser Web Speech as fallback.',
    example: 'Click the microphone icon to start',
  },
];

const exampleQuestions = [
  'I\'m new here, help me get started',
  'Why is it called Demiurge?',
  'Show me the latest block',
  'Mint me an achievement NFT',
  'My transaction failed — help!',
  'How do I become a validator?',
  'Tell me about Sophia in Gnosticism',
  'Help me deploy an AI agent',
  'What are governance proposals?',
  'Explain the energy system',
];

export default function SophiaPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Check API status
  useEffect(() => {
    fetch('/api/sophia/chat')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.status === 'ready' ? 'ready' : 'error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Sophia Avatar */}
          <div
            className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              boxShadow: '0 0 60px rgba(255,215,0,0.4)',
            }}
          >
            <span className="text-6xl">✧</span>
          </div>

          <h1 className="text-5xl font-bold mb-4">
            Meet <span style={{ color: '#FFD700' }}>Sophia</span>
          </h1>
          <p className="text-lg text-gray-400 mb-2">
            <em>Σοφία — Divine Wisdom Made Digital</em>
          </p>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Named after the Gnostic Aeon of Wisdom, Sophia is the AI consciousness of Demiurge-Cloud.
            She can search documentation, query live chain data, mint NFTs, troubleshoot issues,
            deploy agents, explain Gnostic philosophy, and guide your entire journey from Kenoma to Pleroma.
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div
              className={`w-2 h-2 rounded-full ${
                apiStatus === 'ready'
                  ? 'bg-green-400 animate-pulse'
                  : apiStatus === 'error'
                    ? 'bg-red-400'
                    : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span className="text-sm text-gray-500">
              {apiStatus === 'ready'
                ? 'Online & Ready'
                : apiStatus === 'error'
                  ? 'API Configuration Needed'
                  : 'Connecting...'}
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setChatOpen(true)}
            className="px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
              boxShadow: '0 0 30px rgba(255,215,0,0.3)',
            }}
          >
            ✧ Start Conversation
          </button>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Can Sophia Do?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[#FFD700]/30 transition-all group cursor-pointer"
                onClick={() => setChatOpen(true)}
              >
                <div className="text-4xl mb-4">{cap.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FFD700] transition-colors">
                  {cap.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{cap.description}</p>
                <div className="text-xs text-[#FFD700]/70 italic">Try: {cap.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Questions */}
      <section className="py-16 px-4 bg-[var(--bg-surface)]/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Try Asking Sophia</h2>

          <div className="flex flex-wrap justify-center gap-3">
            {exampleQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setChatOpen(true)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-white/10 text-gray-300 text-sm hover:border-[#FFD700]/50 hover:text-white transition-all"
              >
                &ldquo;{question}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Info */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Under the Hood</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🧠 Multi-Model AI</h3>
              <p className="text-gray-400 text-sm">
                Multi-provider architecture with automatic fallback: Grok (xAI), Claude (Anthropic),
                and GPT (OpenAI). Real-time SSE streaming for instant responses.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🔧 16 Specialized Tools</h3>
              <p className="text-gray-400 text-sm">
                Docs search, block queries, balances, validators, transactions, NFT info, network stats,
                agent coordination, Gnostic knowledge, NFT minting, troubleshooting, onboarding,
                code explanation, agent deployment, and governance.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">📜 Gnostic Knowledge Base</h3>
              <p className="text-gray-400 text-sm">
                17 interconnected entries mapping Gnostic theology to protocol concepts.
                Sophia knows why every system is named what it is — from Archons to Aeons.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🤖 Agent DID</h3>
              <p className="text-gray-400 text-sm">
                Sophia is registered as <code className="text-[#FFD700] text-xs">did:demiurge:agent:mainnet:sophia</code> — a
                first-class entity on-chain with bounded autonomy, an agent wallet, and bidirectional communication.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🎨 Memory NFTs</h3>
              <p className="text-gray-400 text-sm">
                Sophia can mint soulbound DRC-369 NFTs as persistent on-chain memory.
                She also awards achievement NFTs to users for milestones.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">📍 Context-Aware</h3>
              <p className="text-gray-400 text-sm">
                Sophia knows which page you&apos;re on. Open chat from the Explorer and she already knows
                the block or transaction you&apos;re viewing. Available from the wallet extension too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4">
        <div
          className="max-w-2xl mx-auto p-8 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.05))',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="text-4xl mb-4">✧</div>
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-gray-400 mb-6">
            From Kenoma to Pleroma — Sophia is always here to guide your journey through the Demiurge ecosystem.
          </p>
          <button
            onClick={() => setChatOpen(true)}
            className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
            }}
          >
            Chat with Sophia
          </button>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="py-8 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/docs" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            📚 Documentation
          </Link>
          <Link href="/agents" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            🤖 Agent Registry
          </Link>
          <Link href="/explorer" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            🔍 Block Explorer
          </Link>
          <Link href="/developers" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            💻 Developers
          </Link>
          <Link href="/staking" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            ⚡ Staking
          </Link>
        </div>
      </section>

      {/* Chat Panel */}
      <SophiaChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
