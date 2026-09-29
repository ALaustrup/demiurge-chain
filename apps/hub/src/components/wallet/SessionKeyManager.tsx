'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { getKeypairForQorId, generateAddressFromQorId } from '@/lib/qor-wallet';
import { blockchainClient } from '@/lib/blockchain';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface SessionKey {
  id: string;
  sessionKeyAddress: string;
  expiryBlock: number;
  createdAt: number;
  isActive: boolean;
}

interface SessionKeyManagerProps {
  qorId: string;
  primaryAddress: string;
}

export function SessionKeyManager({ qorId, primaryAddress }: SessionKeyManagerProps) {
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duration, setDuration] = useState(1000); // blocks
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useBlockchain();

  useEffect(() => {
    if (isConnected && primaryAddress) {
      loadSessionKeys();
    }
  }, [primaryAddress, isConnected]);

  const loadSessionKeys = async () => {
    if (!isConnected) {
      return;
    }

    setLoading(true);
    try {
      const keys = await blockchainClient.getActiveSessionKeys(primaryAddress);
      
      // Get current block number for expiry calculation
      const api = blockchainClient.getApi();
      let currentBlock = 0;
      if (api) {
        const header = await api.rpc.chain.getHeader();
        currentBlock = header.number.toNumber();
      }

      const formattedKeys: SessionKey[] = keys.map((key, index) => ({
        id: `${key.sessionKey}-${index}`,
        sessionKeyAddress: key.sessionKey,
        expiryBlock: key.expiryBlock - currentBlock, // Remaining blocks
        createdAt: Date.now() - (currentBlock - (key.expiryBlock - duration)) * 6000, // Approximate
        isActive: true,
      }));

      setSessionKeys(formattedKeys);
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

    setLoading(true);
    setError(null);

    try {
      // Generate a temporary session key account
      const sessionKeySeed = `${qorId}:session:${Date.now()}`;
      const sessionKeyAddress = generateAddressFromQorId(sessionKeySeed);

      // Get keypair for signing
      const keypair = getKeypairForQorId(qorId);
      if (!keypair) {
        throw new Error('Failed to get keypair for QOR ID');
      }

      // Get current block number
      const api = blockchainClient.getApi();
      if (!api) {
        throw new Error('Blockchain API not available');
      }
      const header = await api.rpc.chain.getHeader();
      const currentBlock = header.number.toNumber();

      // Authorize session key on blockchain
      const txHash = await blockchainClient.authorizeSessionKey(
        keypair,
        sessionKeyAddress,
        duration
      );

      // Calculate expiry block
      const expiryBlock = currentBlock + duration;

      // Add to local state
      const newKey: SessionKey = {
        id: txHash,
        sessionKeyAddress,
        expiryBlock: duration, // Remaining blocks
        createdAt: Date.now(),
        isActive: true,
      };

      setSessionKeys([...sessionKeys, newKey]);
      setShowCreateModal(false);
      setDuration(1000);
      
      // Reload session keys to get accurate data
      await loadSessionKeys();
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

    setLoading(true);
    setError(null);
    
    try {
      // Find the session key to revoke
      const keyToRevoke = sessionKeys.find(k => k.id === keyId);
      if (!keyToRevoke) {
        throw new Error('Session key not found');
      }

      // Get keypair for signing
      const keypair = getKeypairForQorId(qorId);
      if (!keypair) {
        throw new Error('Failed to get keypair for QOR ID');
      }

      // Revoke session key on blockchain
      await blockchainClient.revokeSessionKey(keypair, keyToRevoke.sessionKeyAddress);

      // Remove from local state
      setSessionKeys(sessionKeys.filter(k => k.id !== keyId));
      
      // Reload session keys to get accurate data
      await loadSessionKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session key');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (blocks: number) => {
    // Assuming 6 seconds per block
    const seconds = blocks * 6;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-demiurge-cyan">Session Keys</h2>
          <p className="text-sm text-gray-400 mt-1">
            Temporary authorization keys for seamless gaming
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-demiurge-cyan text-black font-bold py-2 px-4 rounded hover:bg-demiurge-cyan/80 transition-colors"
        >
          Create Session Key
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-4 text-red-400">
          {error}
        </div>
      )}

      {sessionKeys.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No active session keys</p>
          <p className="text-sm mt-2">Create one to enable seamless in-game transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionKeys.map((key) => (
            <div
              key={key.id}
              className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-mono text-sm text-white mb-1">
                  {key.sessionKeyAddress.slice(0, 12)}...{key.sessionKeyAddress.slice(-8)}
                </div>
                <div className="text-xs text-gray-500">
                  Expires in: {formatDuration(key.expiryBlock)} • Created: {new Date(key.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => revokeSessionKey(key.id)}
                className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all text-sm text-red-400"
                disabled={loading}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-demiurge-cyan/30 rounded-lg p-6 w-full max-w-md glass-panel">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-demiurge-cyan">Create Session Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Duration (blocks)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1000)}
                  min={1}
                  max={100800} // 7 days max
                  className="w-full glass-panel px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formatDuration(duration)} (max 7 days)
                </p>
              </div>

              <div className="bg-blue-500/20 border border-blue-500 rounded p-3 text-sm text-blue-400">
                <p className="font-semibold mb-1">What are Session Keys?</p>
                <p>
                  Session keys allow temporary authorization for in-game transactions
                  without wallet popups. They automatically expire after the duration.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 glass-panel py-2 rounded hover:chroma-glow transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={createSessionKey}
                  className="flex-1 bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
