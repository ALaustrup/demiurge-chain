'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { explorerService } from '@/lib/explorer-service';
import type { AccountDetails, TransactionSummary } from '@/lib/explorer-types';

export default function AddressDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'tokens' | 'nfts'>('transactions');

  useEffect(() => {
    async function loadAccount() {
      try {
        const [accountData, txData] = await Promise.all([
          explorerService.getAccountDetails(address),
          explorerService.getRecentTransactions(20),
        ]);
        setAccount(accountData);
        // Filter transactions for this address
        setTransactions(txData.filter(tx => tx.from === address || tx.to === address));
      } catch (error) {
        console.error('Failed to load account:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAccount();
  }, [address]);

  const formatTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400">Loading address...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/explorer" className="text-gray-400 hover:text-white">Explorer</Link>
          <span className="text-gray-600">/</span>
          <span className="text-neon-cyan">Address</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-grunge text-white flex items-center gap-3">
              <span className="text-neon-cyan">👤</span>
              Address
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-mono break-all">
              {address}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {account?.isValidator && (
                <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple rounded text-xs">Validator</span>
              )}
              {account?.isNominator && (
                <span className="px-2 py-1 bg-neon-green/20 text-neon-green rounded text-xs">Nominator</span>
              )}
              {account?.isContract && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Contract</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigator.clipboard.writeText(address)}
              className="glass-panel px-4 py-2 rounded-lg text-gray-400 hover:text-white"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Balance</p>
            <p className="text-2xl font-grunge text-neon-green">
              {parseFloat(account?.balance || '0').toLocaleString()}
              <span className="text-sm text-gray-400 ml-1">CGT</span>
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Transactions</p>
            <p className="text-2xl font-grunge text-neon-cyan">
              {account?.transactionCount || 0}
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">Tokens</p>
            <p className="text-2xl font-grunge text-neon-purple">
              {account?.tokenHoldings?.length || 0}
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-sm">NFTs</p>
            <p className="text-2xl font-grunge text-neon-pink">
              {account?.nfts?.length || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {(['transactions', 'tokens', 'nfts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-grunge-alt capitalize transition-all ${
                activeTab === tab
                  ? 'text-neon-cyan border-b-2 border-neon-cyan'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'transactions' && (
          <div className="glass-panel rounded-xl overflow-hidden">
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-white/10 bg-white/5">
                      <th className="p-4">Txn Hash</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Direction</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Value</th>
                      <th className="p-4">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isIncoming = tx.to === address;
                      return (
                        <tr key={tx.hash} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <Link href={`/explorer/tx/${tx.hash}`} className="text-neon-cyan hover:underline text-sm">
                              {tx.hash.slice(0, 16)}...
                            </Link>
                          </td>
                          <td className="p-4 text-gray-400 text-sm capitalize">
                            {tx.type.replace('_', ' ')}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              isIncoming ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {isIncoming ? 'IN' : 'OUT'}
                            </span>
                          </td>
                          <td className="p-4">
                            <Link 
                              href={`/explorer/address/${isIncoming ? tx.from : tx.to}`}
                              className="text-gray-400 hover:text-white text-sm"
                            >
                              {(isIncoming ? tx.from : tx.to)?.slice(0, 12)}...
                            </Link>
                          </td>
                          <td className="p-4 text-white text-sm">
                            {parseFloat(tx.value).toLocaleString()} CGT
                          </td>
                          <td className="p-4 text-gray-400 text-sm">{formatTimeAgo(tx.timestamp)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No transactions found for this address
              </div>
            )}
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="glass-panel rounded-xl overflow-hidden">
            {account?.tokenHoldings && account.tokenHoldings.length > 0 ? (
              <div className="divide-y divide-white/5">
                {account.tokenHoldings.map((token, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                        <span className="text-lg">🪙</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{token.symbol}</p>
                        <p className="text-gray-500 text-sm">{token.token}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{parseFloat(token.balance).toLocaleString()}</p>
                      {token.value && (
                        <p className="text-gray-500 text-sm">${token.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No token holdings found
              </div>
            )}
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="glass-panel rounded-xl p-6">
            {account?.nfts && account.nfts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {account.nfts.map((nft, i) => (
                  <div key={i} className="glass-panel rounded-lg overflow-hidden group cursor-pointer hover:border-neon-cyan transition-colors">
                    <div className="aspect-square bg-white/5 relative">
                      {nft.image ? (
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm truncate">{nft.name}</p>
                      <p className="text-gray-500 text-xs">{nft.collection}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No NFTs found
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
