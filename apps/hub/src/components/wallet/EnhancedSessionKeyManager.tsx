'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { generateKeypairFromQorId, generateAddressFromQorId } from '@/lib/qor-wallet';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { signTransactionPayload } from '@/lib/wasm-wallet';
import { EnergyDisplay } from '@/components/energy/EnergyDisplay';

interface SessionKey {
  id: string;
  sessionKeyAddress: string;
  expiryBlock: number;
  createdAt: number;
  isActive: boolean;
  energyUsed?: number;
  transactionsCount?: number;
  label?: string;
}

interface EnhancedSessionKeyManagerProps {
  qorId: string;
  primaryAddress: string;
}

export function EnhancedSessionKeyManager({ qorId, primaryAddress }: EnhancedSessionKeyManagerProps) {
  const { isConnected, getBlockNumber, getEnergy } = useBlockchain();
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duration, setDuration] = useState(1000); // blocks
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [selectedKey, setSelectedKey] = useState<SessionKey | null>(null);

  useEffect(() => {
    if (isConnected && primaryAddress) {
      loadSessionKeys();
      loadCurrentBlock();
      const interval = setInterval(() => {
        loadSessionKeys();
        loadCurrentBlock();
      }, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [primaryAddress, isConnected]);

  const loadCurrentBlock = async () => {
    try {
      const block = await getBlockNumber();
      setCurrentBlock(block);
    } catch (err) {
      console.error('Failed to load current block:', err);
    }
  };

  const loadSessionKeys = async () => {
    if (!isConnected) {
      return;
    }

    setLoading(true);
    try {
      const keys = await demiurgeRpc.getSessionKeys(primaryAddress);
      
      // Get current block for expiry calculation
      const block = await getBlockNumber();
      setCurrentBlock(block);

      // Load energy for each session key (if available)
      const formattedKeys: SessionKey[] = await Promise.all(
        keys.map(async (key, index) => {
          // Try to get energy for session key (may not be available)
          let energyUsed = 0;
          try {
            const energy = await getEnergy(key.sessionKey);
            // Estimate energy used (max - current, but this is approximate)
            energyUsed = Math.max(0, energy.max - energy.current);
          } catch {
            // Energy tracking not available for this key
            energyUsed = 0;
          }

          const remainingBlocks = key.expiryBlock - block;
          const isExpiringSoon = remainingBlocks < 1000; // Less than ~100 minutes
          const isExpired = remainingBlocks <= 0;

          return {
            id: `${key.sessionKey}-${index}`,
            sessionKeyAddress: key.sessionKey,
            expiryBlock: key.expiryBlock,
            createdAt: Date.now() - (remainingBlocks * 1000), // Approximate
            isActive: !isExpired,
            energyUsed,
            transactionsCount: 0, // TODO: Track from transaction history
            label: `Session Key ${index + 1}`,
          };
        })
      );

      setSessionKeys(formattedKeys.filter(k => k.isActive));
    } catch (err: any) {
      console.error('Failed to load session keys:', err);
      setError(err.message || 'Failed to load session keys');
    } finally {
      setLoading(false);
    }
  };

  const createSessionKey = async () => {
    if (!isConnected) {
      setError('Blockchain not connected');
      return;
    }

    if (duration < 1 || duration > 100800) {
      setError('Duration must be between 1 and 100,800 blocks (7 days)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const user = await qorAuth.getProfile();
      if (!user) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Verify address matches QOR ID
      const expectedAddress = generateAddressFromQorId(user.qor_id);
      if (expectedAddress.toLowerCase() !== primaryAddress.toLowerCase()) {
        throw new Error('Wallet address does not match your QOR ID');
      }

      // Generate a temporary session key account
      const sessionKeySeed = `${qorId}:session:${Date.now()}`;
      const sessionKeyAddress = generateAddressFromQorId(sessionKeySeed);

      // Generate keypair from QOR ID
      const keypairJson = await generateKeypairFromQorId(user.qor_id);

      // Get current block number
      const block = await getBlockNumber();

      // Create transaction payload
      const payload = {
        from: primaryAddress,
        sessionKey: sessionKeyAddress,
        duration,
        nonce: Date.now(),
        call: 'authorizeSessionKey',
      };

      // Sign transaction
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
      const signature = await signTransactionPayload(keypairJson, payloadBytes);

      // Submit transaction via RPC
      const txHash = await demiurgeRpc.authorizeSessionKey(
        primaryAddress,
        sessionKeyAddress,
        duration,
        signature
      );

      // Reload session keys
      await loadSessionKeys();
      setShowCreateModal(false);
      setDuration(1000);
      setLabel('');
    } catch (err: any) {
      setError(err.message || 'Failed to create session key');
    } finally {
      setLoading(false);
    }
  };

  const revokeSessionKey = async (keyId: string) => {
    if (!isConnected) {
      setError('Blockchain not connected');
      return;
    }

    if (!confirm('Are you sure you want to revoke this session key? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const keyToRevoke = sessionKeys.find(k => k.id === keyId);
      if (!keyToRevoke) {
        throw new Error('Session key not found');
      }

      // Get current user
      const user = await qorAuth.getProfile();
      if (!user) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Generate keypair from QOR ID
      const keypairJson = await generateKeypairFromQorId(user.qor_id);

      // Create revoke transaction payload
      const payload = {
        from: primaryAddress,
        sessionKey: keyToRevoke.sessionKeyAddress,
        nonce: Date.now(),
        call: 'revokeSessionKey',
      };

      // Sign transaction
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
      const signature = await signTransactionPayload(keypairJson, payloadBytes);

      // TODO: Implement revokeSessionKey RPC method
      // For now, just remove from local state
      setSessionKeys(sessionKeys.filter(k => k.id !== keyId));
      
      // Reload session keys
      await loadSessionKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session key');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (blocks: number) => {
    // Assuming 1 second per block
    const seconds = blocks;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getExpiryStatus = (expiryBlock: number) => {
    const remainingBlocks = expiryBlock - currentBlock;
    if (remainingBlocks <= 0) {
      return { status: 'expired', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' };
    }
    if (remainingBlocks < 1000) {
      return { status: 'expiring', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50' };
    }
    return { status: 'active', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50' };
  };

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-demiurge-cyan">Session Keys</h2>
          <p className="text-sm text-gray-400 mt-1">
            Temporary authorization keys for seamless gaming and app integration
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-demiurge-cyan text-black font-bold py-2 px-4 rounded hover:bg-demiurge-cyan/80 transition-colors"
        >
          + Create Session Key
        </button>
      </div>

      {/* Energy Display */}
      <div className="mb-6">
        <EnergyDisplay address={primaryAddress} />
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {loading && sessionKeys.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : sessionKeys.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-4">🔑</div>
          <p className="text-lg font-medium mb-2">No active session keys</p>
          <p className="text-sm">Create one to enable seamless in-game transactions</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">
              Active Session Keys ({sessionKeys.length})
            </p>
            <button
              onClick={loadSessionKeys}
              className="text-xs text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {sessionKeys.map((key) => {
            const expiryStatus = getExpiryStatus(key.expiryBlock);
            const remainingBlocks = key.expiryBlock - currentBlock;
            const expiryPercentage = Math.max(0, Math.min(100, (remainingBlocks / 1000) * 100));

            return (
              <div
                key={key.id}
                className={`${expiryStatus.bg} ${expiryStatus.border} rounded-lg p-5 border transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                        {key.label?.charAt(0) || 'K'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {key.label || 'Unnamed Session Key'}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded ${expiryStatus.bg} ${expiryStatus.color}`}>
                            {expiryStatus.status === 'expired' ? 'Expired' : 
                             expiryStatus.status === 'expiring' ? 'Expiring Soon' : 'Active'}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-gray-400 mt-1">
                          {key.sessionKeyAddress.slice(0, 12)}...{key.sessionKeyAddress.slice(-8)}
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Expires In</p>
                        <p className={`text-sm font-bold ${expiryStatus.color}`}>
                          {remainingBlocks > 0 ? formatDuration(remainingBlocks) : 'Expired'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Block #{key.expiryBlock}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Energy Used</p>
                        <p className="text-sm font-bold text-white">
                          {key.energyUsed?.toLocaleString() || '0'} / 10,000
                        </p>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, ((key.energyUsed || 0) / 10000) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Transactions</p>
                        <p className="text-sm font-bold text-white">
                          {key.transactionsCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Total count</p>
                      </div>
                    </div>

                    {/* Expiry Progress Bar */}
                    {remainingBlocks > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Time Remaining</span>
                          <span>{expiryPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              expiryStatus.status === 'expiring' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${expiryPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Expiry Warning */}
                    {expiryStatus.status === 'expiring' && (
                      <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-2 mb-3">
                        <p className="text-xs text-yellow-300 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>This session key will expire soon. Create a new one to avoid interruption.</span>
                        </p>
                      </div>
                    )}

                    {/* Created Date */}
                    <p className="text-xs text-gray-500">
                      Created: {new Date(key.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setSelectedKey(selectedKey?.id === key.id ? null : key)}
                      className="glass-panel px-3 py-2 rounded hover:chroma-glow transition-all text-xs"
                    >
                      {selectedKey?.id === key.id ? 'Hide' : 'Details'}
                    </button>
                    <button
                      onClick={() => revokeSessionKey(key.id)}
                      className="bg-red-900/50 border border-red-500/50 px-3 py-2 rounded hover:bg-red-900/70 transition-all text-xs text-red-400"
                      disabled={loading}
                    >
                      Revoke
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedKey?.id === key.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Full Address</p>
                        <p className="font-mono text-xs text-white break-all">{key.sessionKeyAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Expiry Block</p>
                        <p className="text-white font-mono">{key.expiryBlock.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Created</p>
                        <p className="text-white">{new Date(key.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className={expiryStatus.color}>{expiryStatus.status.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-demiurge-cyan">Create Session Key</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setLabel('');
                  setDuration(1000);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Game Session #1"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (blocks)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1000)}
                  min={1}
                  max={100800} // 7 days max
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formatDuration(duration)} (max 7 days / 100,800 blocks)
                </p>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 text-sm text-blue-300">
                <p className="font-semibold mb-1">💡 What are Session Keys?</p>
                <p className="text-xs">
                  Session keys allow temporary authorization for in-game transactions without wallet popups.
                  They automatically expire after the duration. Energy consumption is tracked per key.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setLabel('');
                    setDuration(1000);
                  }}
                  className="flex-1 glass-panel py-2 rounded hover:chroma-glow transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={createSessionKey}
                  className="flex-1 bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors disabled:opacity-50"
                  disabled={loading || duration < 1 || duration > 100800}
                >
                  {loading ? 'Creating...' : 'Create Session Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
