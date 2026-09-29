'use client';

import { useState } from 'react';

interface Issue {
  id: string;
  title: string;
  symptoms: string[];
  solution: string;
  commands?: string[];
  category: 'node' | 'rpc' | 'wallet' | 'sdk' | 'docker';
}

const issues: Issue[] = [
  // Node Issues
  {
    id: 'node-sync',
    title: 'Node Not Syncing',
    symptoms: ['Block height stuck', 'No new blocks', 'Peer count is 0'],
    solution: 'Check network connectivity and firewall rules. Ensure port 30333 is open for P2P connections.',
    commands: ['# Check peer connections', 'curl http://localhost:9933 -d \'{"id":1,"jsonrpc":"2.0","method":"system_peers"}\'', '', '# Check sync status', 'curl http://localhost:9933 -d \'{"id":1,"jsonrpc":"2.0","method":"system_syncState"}\''],
    category: 'node',
  },
  {
    id: 'node-crash',
    title: 'Node Crashes on Startup',
    symptoms: ['Immediate exit', 'Panic messages', 'Database errors'],
    solution: 'Check disk space and database integrity. Try purging the chain data and resyncing.',
    commands: ['# Check disk space', 'df -h', '', '# Purge chain data (WARNING: will resync)', 'demiurge-node purge-chain --chain mainnet'],
    category: 'node',
  },
  {
    id: 'node-memory',
    title: 'High Memory Usage',
    symptoms: ['OOM errors', 'System slowdown', 'Memory usage > 32GB'],
    solution: 'Enable state pruning and reduce cache size in configuration.',
    commands: ['# Run with reduced cache', 'demiurge-node --db-cache 512 --state-pruning 1000'],
    category: 'node',
  },
  // RPC Issues
  {
    id: 'rpc-connection',
    title: 'Cannot Connect to RPC',
    symptoms: ['Connection refused', 'WebSocket error', 'Timeout'],
    solution: 'Verify the node is running and RPC is enabled. Check that the RPC port (9944) is accessible.',
    commands: ['# Test RPC connection', 'curl http://localhost:9933/health', '', '# Check if node is running', 'systemctl status demiurge-node'],
    category: 'rpc',
  },
  {
    id: 'rpc-rate-limit',
    title: 'Rate Limited (429)',
    symptoms: ['429 Too Many Requests', 'Requests failing intermittently'],
    solution: 'Reduce request frequency or use WebSocket subscriptions for real-time data. Consider running your own node.',
    category: 'rpc',
  },
  // Wallet Issues
  {
    id: 'wallet-connect',
    title: 'Wallet Not Detected',
    symptoms: ['window.demiurge is undefined', 'Connect button not working'],
    solution: 'Ensure the wallet extension is installed and enabled. Refresh the page after installation.',
    commands: ['// Check if wallet is installed', 'if (typeof window.demiurge !== "undefined") {', '  console.log("Wallet detected!");', '} else {', '  console.log("Please install Demiurge Wallet");', '}'],
    category: 'wallet',
  },
  {
    id: 'wallet-transaction',
    title: 'Transaction Failing',
    symptoms: ['Transaction rejected', 'Insufficient balance', 'Invalid signature'],
    solution: 'Check account balance and energy. Ensure you have enough CGT for the transaction and energy for fees.',
    category: 'wallet',
  },
  // SDK Issues
  {
    id: 'sdk-typescript',
    title: 'TypeScript Type Errors',
    symptoms: ['Type mismatch', 'Cannot find module', 'Declaration errors'],
    solution: 'Update to the latest SDK version and ensure TypeScript is configured correctly.',
    commands: ['# Update SDK', 'npm update @demiurge/sdk', '', '# Check TypeScript version', 'npx tsc --version'],
    category: 'sdk',
  },
  // Docker Issues
  {
    id: 'docker-network',
    title: 'Docker Nodes Not Connecting',
    symptoms: ['Nodes isolated', 'No peer connections between containers'],
    solution: 'Ensure all containers are on the same Docker network and bootnodes are configured correctly.',
    commands: ['# Check network', 'docker network ls', 'docker network inspect demiurge-network', '', '# View container logs', 'docker-compose logs -f node1'],
    category: 'docker',
  },
];

const categories = [
  { id: 'all', label: 'All Issues', icon: '📋' },
  { id: 'node', label: 'Node', icon: '🖥️' },
  { id: 'rpc', label: 'RPC', icon: '📡' },
  { id: 'wallet', label: 'Wallet', icon: '🔐' },
  { id: 'sdk', label: 'SDK', icon: '📘' },
  { id: 'docker', label: 'Docker', icon: '🐳' },
];

export default function TroubleshootingPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const filteredIssues = selectedCategory === 'all'
    ? issues
    : issues.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔍</span>
          <h1 className="text-3xl font-bold">Troubleshooting</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Solutions to common issues with nodes, wallets, SDK, and deployments.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
              ${selectedCategory === cat.id
                ? 'bg-[var(--accent-primary)] text-black'
                : 'bg-[var(--bg-surface)] text-gray-300 hover:bg-white/5'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-xl bg-[var(--bg-surface)] border border-white/10 overflow-hidden"
          >
            <button
              onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {issue.category === 'node' && '🖥️'}
                  {issue.category === 'rpc' && '📡'}
                  {issue.category === 'wallet' && '🔐'}
                  {issue.category === 'sdk' && '📘'}
                  {issue.category === 'docker' && '🐳'}
                </span>
                <div>
                  <div className="font-medium text-white">{issue.title}</div>
                  <div className="text-sm text-gray-500">
                    {issue.symptoms.slice(0, 2).join(' • ')}
                  </div>
                </div>
              </div>
              <span className={`transform transition-transform ${expandedIssue === issue.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedIssue === issue.id && (
              <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                {/* Symptoms */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Symptoms</div>
                  <ul className="space-y-1">
                    {issue.symptoms.map((symptom, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                        <span className="text-red-400">•</span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Solution */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Solution</div>
                  <p className="text-sm text-gray-300">{issue.solution}</p>
                </div>

                {/* Commands */}
                {issue.commands && (
                  <div>
                    <div className="text-sm font-medium text-gray-400 mb-2">Commands</div>
                    <pre className="bg-black/30 rounded-lg p-3 text-xs overflow-x-auto">
                      <code className="text-gray-300">
                        {issue.commands.map((cmd, i) => (
                          <div key={i} className={cmd.startsWith('#') || cmd.startsWith('//') ? 'text-gray-500' : ''}>
                            {cmd}
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Still Need Help */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/10 text-center">
        <div className="text-3xl mb-3">🤔</div>
        <h3 className="font-semibold text-lg mb-2">Still having issues?</h3>
        <p className="text-gray-400 mb-4">
          Ask Sophia for personalized help or join our Discord community.
        </p>
        <div className="flex justify-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-black font-medium hover:bg-[var(--accent-primary)]/80 transition-colors">
            Ask Sophia
          </button>
          <a
            href="https://discord.gg/demiurge"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            Join Discord
          </a>
        </div>
      </div>

      {/* Diagnostic Commands */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Diagnostic Commands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="font-medium text-white mb-2">Node Health</div>
            <pre className="text-sm font-mono text-[var(--accent-primary)]">
              curl http://localhost:9933/health
            </pre>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="font-medium text-white mb-2">System Info</div>
            <pre className="text-sm font-mono text-[var(--accent-primary)]">
              demiurge --version
            </pre>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="font-medium text-white mb-2">View Logs</div>
            <pre className="text-sm font-mono text-[var(--accent-primary)]">
              journalctl -u demiurge-node -f
            </pre>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface)] border border-white/10 p-4">
            <div className="font-medium text-white mb-2">Docker Logs</div>
            <pre className="text-sm font-mono text-[var(--accent-primary)]">
              docker-compose logs -f --tail=100
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
