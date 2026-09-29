/**
 * Block Explorer Types
 * 
 * Comprehensive type definitions for the Demiurge Block Explorer
 */

// ============ Block Types ============

export interface BlockDetails {
  hash: string;
  number: number;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: number;
  validator: string;
  size: number;
  energyUsed: number;
  energyLimit: number;
  transactionCount: number;
  transactions: TransactionSummary[];
  era: number;
  finalized: boolean;
}

export interface BlockSummary {
  hash: string;
  number: number;
  timestamp: number;
  transactionCount: number;
  validator: string;
  size: number;
  finalized: boolean;
}

// ============ Transaction Types ============

export interface TransactionDetails {
  hash: string;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  value: string;
  energyPrice: string;
  energyUsed: number;
  energyLimit: number;
  nonce: number;
  input: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  type: TransactionType;
  confirmations: number;
  fee: string;
  // Token transfer details (if applicable)
  tokenTransfers?: TokenTransfer[];
  // Internal transactions
  internalTxs?: InternalTransaction[];
  // Logs/Events
  logs?: TransactionLog[];
}

export interface TransactionSummary {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  type: TransactionType;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
}

export type TransactionType = 
  | 'transfer'
  | 'stake'
  | 'unstake'
  | 'claim_reward'
  | 'nft_mint'
  | 'nft_transfer'
  | 'contract_call'
  | 'contract_create'
  | 'governance'
  | 'system';

export interface TokenTransfer {
  token: string;
  tokenSymbol: string;
  from: string;
  to: string;
  value: string;
  decimals: number;
}

export interface InternalTransaction {
  type: 'call' | 'create' | 'selfdestruct';
  from: string;
  to: string;
  value: string;
  success: boolean;
}

export interface TransactionLog {
  index: number;
  address: string;
  topics: string[];
  data: string;
  decodedEvent?: {
    name: string;
    args: Record<string, any>;
  };
}

// ============ Account Types ============

export interface AccountDetails {
  address: string;
  balance: string;
  nonce: number;
  transactionCount: number;
  tokenHoldings: TokenHolding[];
  nfts: NFTHolding[];
  isContract: boolean;
  isValidator: boolean;
  isNominator: boolean;
  stakedAmount?: string;
  rewards?: string;
  createdAt?: number;
}

export interface TokenHolding {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  value?: string; // USD value if available
}

export interface NFTHolding {
  tokenId: string;
  collection: string;
  name: string;
  image: string;
}

// ============ Network Stats ============

export interface NetworkStats {
  // Chain info
  blockHeight: number;
  blockTime: number;
  lastBlockTime: number;
  tps: number;
  avgTps24h: number;
  
  // Era/Epoch info
  currentEra: number;
  eraProgress: number;
  eraStartBlock: number;
  blocksPerEra: number;
  
  // Validator info
  activeValidators: number;
  totalValidators: number;
  validatorSetChanges: number;
  
  // Economic info
  totalSupply: string;
  circulatingSupply: string;
  totalStaked: string;
  stakingRatio: number;
  totalTransactionFees: string;
  
  // Network health
  finality: number;
  peerCount: number;
  networkVersion: string;
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

export interface NetworkCharts {
  blockTimes: ChartDataPoint[];
  tpsHistory: ChartDataPoint[];
  transactionsPerBlock: ChartDataPoint[];
  energyUsedHistory: ChartDataPoint[];
  activeAddresses: ChartDataPoint[];
  stakingHistory: ChartDataPoint[];
}

// ============ Validator Types ============

export interface ValidatorDetails {
  address: string;
  name?: string;
  identity?: {
    display: string;
    legal?: string;
    web?: string;
    email?: string;
    twitter?: string;
  };
  stake: string;
  selfStake: string;
  nominators: number;
  nominatorStake: string;
  commission: number;
  active: boolean;
  blocksProduced: number;
  blocksProducedEra: number;
  missedBlocks: number;
  uptime: number;
  rewards24h: string;
  rewardsTotal: string;
  slashEvents: SlashEvent[];
}

export interface SlashEvent {
  era: number;
  blockNumber: number;
  amount: string;
  reason: string;
  timestamp: number;
}

export interface ValidatorSummary {
  address: string;
  name?: string;
  stake: string;
  commission: number;
  nominators: number;
  active: boolean;
  blocksProducedEra: number;
  uptime: number;
}

// ============ Search Types ============

export type SearchResultType = 'block' | 'transaction' | 'address' | 'validator' | 'token';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

// ============ Historical Data ============

export interface HistoricalData {
  blocks: BlockSummary[];
  transactions: TransactionSummary[];
  validators: ValidatorSummary[];
}

// ============ Pagination ============

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ Filters ============

export interface BlockFilter {
  fromBlock?: number;
  toBlock?: number;
  validator?: string;
  minTxCount?: number;
}

export interface TransactionFilter {
  fromBlock?: number;
  toBlock?: number;
  from?: string;
  to?: string;
  type?: TransactionType;
  status?: 'success' | 'failed' | 'pending';
  minValue?: string;
}
