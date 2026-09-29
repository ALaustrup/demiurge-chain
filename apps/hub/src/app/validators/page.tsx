'use client';

import { useState, useEffect, useMemo } from 'react';
import { demiurgeRpc, ValidatorInfo, EraInfo, StakingPoolInfo } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { ValidatorRegistration } from '@/components/consensus/ValidatorRegistration';

type SortField = 'stake' | 'commission' | 'account';
type SortDirection = 'asc' | 'desc';

export default function ValidatorsPage() {
  const { getConsensusStatus } = useBlockchain();
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [eraInfo, setEraInfo] = useState<EraInfo | null>(null);
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo | null>(null);
  const [stakingPool, setStakingPool] = useState<StakingPoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [maxCommission, setMaxCommission] = useState<number>(100);
  const [sortField, setSortField] = useState<SortField>('stake');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedValidator) {
      loadStakingPool(selectedValidator.account);
    }
  }, [selectedValidator]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [era, validatorsList, status] = await Promise.all([
        demiurgeRpc.getCurrentEra().catch(() => null),
        demiurgeRpc.getValidators().catch(() => []),
        getConsensusStatus().catch(() => null),
      ]);

      setEraInfo(era);
      setValidators(validatorsList);
    } catch (err: any) {
      setError(err.message || 'Failed to load validator data');
    } finally {
      setLoading(false);
    }
  };

  const loadStakingPool = async (validatorAccount: string) => {
    try {
      const pool = await demiurgeRpc.getStakingPool(validatorAccount);
      setStakingPool(pool);
    } catch (err: any) {
      console.error('Failed to load staking pool:', err);
      setStakingPool(null);
    }
  };

  // Filter and sort validators
  const filteredAndSortedValidators = useMemo(() => {
    let filtered = [...validators];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.account.toLowerCase().includes(query) ||
        v.publicKey.toLowerCase().includes(query)
      );
    }

    // Active filter
    if (filterActive !== null) {
      filtered = filtered.filter(v => v.active === filterActive);
    }

    // Commission filter
    filtered = filtered.filter(v => v.commission <= maxCommission);

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'stake':
          aVal = BigInt(a.stake);
          bVal = BigInt(b.stake);
          break;
        case 'commission':
          aVal = a.commission;
          bVal = b.commission;
          break;
        case 'account':
          aVal = a.account;
          bVal = b.account;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [validators, searchQuery, filterActive, maxCommission, sortField, sortDirection]);

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading && validators.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Validators</h1>
            <p className="text-gray-400 mt-2">
              Manage and monitor blockchain validators
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRegistration(!showRegistration)}
              className="px-4 py-2 bg-gradient-to-r from-demiurge-cyan to-green-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              {showRegistration ? 'Hide Registration' : 'Become a Validator'}
            </button>
            <button
              onClick={loadData}
              className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Validator Registration Panel */}
        {showRegistration && (
          <ValidatorRegistration onRegistered={() => { setShowRegistration(false); loadData(); }} />
        )}

        {/* Era Information */}
        {eraInfo && (
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold mb-4 text-white">Current Era Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Era Number</p>
                <p className="text-2xl font-bold text-white">{eraInfo.era}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Block Number</p>
                <p className="text-2xl font-bold text-white">{eraInfo.blockNumber.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Rewards</p>
                <p className="text-2xl font-bold text-green-400">{formatBalance(eraInfo.totalRewards)} CGT</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Transaction Fees</p>
                <p className="text-2xl font-bold text-yellow-400">{formatBalance(eraInfo.transactionFees)} CGT</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="glass-panel rounded-lg p-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Validators
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by address or public key..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Active Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
                onChange={(e) => {
                  if (e.target.value === 'all') setFilterActive(null);
                  else setFilterActive(e.target.value === 'active');
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Commission Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Commission: {maxCommission}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={maxCommission}
                onChange={(e) => setMaxCommission(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredAndSortedValidators.length} of {validators.length} validators
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Validators Table */}
        <div className="glass-panel rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort('account')}>
                    Validator <SortIcon field="account" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort('stake')}>
                    Stake <SortIcon field="stake" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort('commission')}>
                    Commission <SortIcon field="commission" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedValidators.map((validator) => (
                  <tr
                    key={validator.account}
                    className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      selectedValidator?.account === validator.account ? 'bg-blue-900/30' : ''
                    }`}
                    onClick={() => setSelectedValidator(validator)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div>
                          <div className="text-sm font-mono text-white">
                            {formatAddress(validator.account)}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {formatAddress(validator.publicKey)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">
                        {formatBalance(validator.stake)} CGT
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {validator.commission}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {validator.active ? (
                        <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedValidator(validator);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedValidators.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No validators found matching your filters
            </div>
          )}
        </div>

        {/* Validator Details Panel */}
        {selectedValidator && (
          <div className="glass-panel rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Validator Details</h2>
              <button
                onClick={() => setSelectedValidator(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Account Address</h3>
                <p className="font-mono text-sm text-white break-all">{selectedValidator.account}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Public Key</h3>
                <p className="font-mono text-sm text-white break-all">{selectedValidator.publicKey}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Total Stake</h3>
                <p className="text-xl font-bold text-white">{formatBalance(selectedValidator.stake)} CGT</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Commission</h3>
                <p className="text-xl font-bold text-white">{selectedValidator.commission}%</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
                <span className={`px-3 py-1 text-sm rounded ${
                  selectedValidator.active
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {selectedValidator.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Staking Pool Details */}
            {stakingPool ? (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">Staking Pool</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Pool Stake</p>
                    <p className="text-xl font-bold text-white">{formatBalance(stakingPool.totalStake)} CGT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Commission Rate</p>
                    <p className="text-xl font-bold text-white">{stakingPool.commission}%</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Nominators ({stakingPool.nominators.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stakingPool.nominators.map((nominator) => (
                      <div
                        key={nominator.account}
                        className="p-3 bg-gray-800/50 rounded border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-sm text-gray-300">
                            {formatAddress(nominator.account)}
                          </p>
                          <div className="text-right">
                            <p className="text-white font-bold">{formatBalance(nominator.stake)} CGT</p>
                            <p className="text-xs text-gray-400">Era {nominator.era}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {stakingPool.nominators.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No nominators yet</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-6">
                <p className="text-gray-400">Loading staking pool details...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
