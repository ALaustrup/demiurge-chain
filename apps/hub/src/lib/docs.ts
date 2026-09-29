/**
 * Demiurge Documentation Utilities
 * Handles loading, parsing, and searching documentation content
 */

export interface DocMeta {
  title: string;
  description: string;
  category: string;
  order?: number;
  lastUpdated?: string;
  tags?: string[];
}

export interface DocPage {
  slug: string;
  meta: DocMeta;
  content: string;
  href: string;
}

export interface SearchResult {
  title: string;
  description: string;
  href: string;
  category: string;
  icon: string;
  relevance: number;
  excerpt?: string;
}

// Category icons mapping
export const categoryIcons: Record<string, string> = {
  'Getting Started': '🚀',
  'Developers': '💻',
  'SDK & Tools': '🔧',
  'Validators': '⚡',
  'Specifications': '📋',
  'Architecture': '🏗️',
  'Deployment': '🚢',
  'Troubleshooting': '🔍',
};

// Static documentation index for client-side search
export const docsIndex: SearchResult[] = [
  // Getting Started
  { 
    title: '5-Minute Quickstart', 
    description: 'Get running with Demiurge in under 5 minutes', 
    href: '/docs/getting-started/5-minute-quickstart', 
    category: 'Getting Started', 
    icon: '🚀', 
    relevance: 100 
  },
  { 
    title: 'Wallet Setup', 
    description: 'Install the browser extension and create your wallet', 
    href: '/docs/getting-started/wallet-setup', 
    category: 'Getting Started', 
    icon: '🔑', 
    relevance: 95 
  },
  { 
    title: 'First Transaction', 
    description: 'Send your first CGT transfer on the network', 
    href: '/docs/getting-started/first-transaction', 
    category: 'Getting Started', 
    icon: '💸', 
    relevance: 90 
  },
  { 
    title: 'Testnet Quickstart', 
    description: 'Connect to the testnet, get test tokens, and experiment', 
    href: '/docs/getting-started/testnet-quickstart', 
    category: 'Getting Started', 
    icon: '🌐', 
    relevance: 85 
  },
  
  // Developers
  { 
    title: 'Complete Setup Guide', 
    description: 'Full development environment setup from scratch', 
    href: '/docs/developers/complete-setup', 
    category: 'Developers', 
    icon: '📥', 
    relevance: 100 
  },
  { 
    title: 'RPC Reference', 
    description: 'Complete JSON-RPC 2.0 API documentation', 
    href: '/docs/developers/rpc-reference', 
    category: 'Developers', 
    icon: '📡', 
    relevance: 98 
  },
  { 
    title: 'Validator CLI', 
    description: 'Command-line tools for validator operations', 
    href: '/docs/developers/validator-cli', 
    category: 'Developers', 
    icon: '⌨️', 
    relevance: 85 
  },
  { 
    title: 'dApp Quickstart', 
    description: 'Build your first Demiurge-integrated application', 
    href: '/docs/developers/dapp-quickstart', 
    category: 'Developers', 
    icon: '🌐', 
    relevance: 92 
  },
  { 
    title: 'WebSocket Subscriptions', 
    description: 'Real-time blockchain event streaming', 
    href: '/docs/developers/rpc-reference#websocket', 
    category: 'Developers', 
    icon: '🔌', 
    relevance: 80 
  },
  
  // SDK
  { 
    title: 'TypeScript SDK', 
    description: 'Complete @demiurge/sdk reference and examples', 
    href: '/docs/sdk/typescript', 
    category: 'SDK & Tools', 
    icon: '📘', 
    relevance: 100 
  },
  { 
    title: 'Wallet Extension', 
    description: 'Browser wallet development and dApp integration', 
    href: '/docs/sdk/wallet-extension', 
    category: 'SDK & Tools', 
    icon: '🔐', 
    relevance: 95 
  },
  { 
    title: 'Unreal Engine SDK', 
    description: 'Integrate Demiurge into Unreal Engine projects', 
    href: '/docs/sdk/unreal', 
    category: 'SDK & Tools', 
    icon: '🎮', 
    relevance: 85 
  },
  
  // Validators
  { 
    title: 'Validator Quickstart', 
    description: 'Become a validator and start earning rewards', 
    href: '/docs/validators/quickstart', 
    category: 'Validators', 
    icon: '⚡', 
    relevance: 100 
  },
  { 
    title: 'Staking Guide', 
    description: 'Stake CGT to validators and earn rewards', 
    href: '/docs/validators/staking', 
    category: 'Validators', 
    icon: '💰', 
    relevance: 90 
  },
  
  // Specifications
  { 
    title: 'DRC-369 NFT Standard', 
    description: 'Dynamic NFTs with physics and composability', 
    href: '/docs/specifications/drc369', 
    category: 'Specifications', 
    icon: '🎨', 
    relevance: 100 
  },
  { 
    title: 'CGT Tokenomics', 
    description: 'Token economics and distribution', 
    href: '/docs/specifications/cgt-tokenomics', 
    category: 'Specifications', 
    icon: '💎', 
    relevance: 95 
  },
  { 
    title: 'CVP Security', 
    description: 'Consensus-Verified Polymorphism for runtime security', 
    href: '/docs/specifications/cvp', 
    category: 'Specifications', 
    icon: '🛡️', 
    relevance: 90 
  },
  { 
    title: 'QOR ID', 
    description: 'Decentralized identity specification', 
    href: '/docs/specifications/qor-id', 
    category: 'Specifications', 
    icon: '🆔', 
    relevance: 85 
  },
  
  // Architecture
  { 
    title: 'Architecture Overview', 
    description: 'System architecture and design principles', 
    href: '/docs/architecture', 
    category: 'Architecture', 
    icon: '🏗️', 
    relevance: 100 
  },
  { 
    title: 'Consensus Mechanism', 
    description: 'Hybrid PoS + BFT consensus design', 
    href: '/docs/architecture/consensus', 
    category: 'Architecture', 
    icon: '⚙️', 
    relevance: 95 
  },
  { 
    title: 'Network Layer', 
    description: 'LibP2P networking and peer discovery', 
    href: '/docs/architecture/network', 
    category: 'Architecture', 
    icon: '🌐', 
    relevance: 85 
  },
  
  // Deployment
  { 
    title: 'Docker Testnet', 
    description: '4-node testnet with Docker Compose', 
    href: '/docs/deployment/docker-testnet', 
    category: 'Deployment', 
    icon: '🐳', 
    relevance: 100 
  },
  { 
    title: 'Production Deployment', 
    description: 'Deploy to production servers', 
    href: '/docs/deployment/production', 
    category: 'Deployment', 
    icon: '🚀', 
    relevance: 95 
  },
  { 
    title: 'Configuration Reference', 
    description: 'All configuration options explained', 
    href: '/docs/deployment/configuration', 
    category: 'Deployment', 
    icon: '⚙️', 
    relevance: 90 
  },
  
  // Troubleshooting
  { 
    title: 'Common Issues', 
    description: 'Solutions to frequently encountered problems', 
    href: '/docs/troubleshooting', 
    category: 'Troubleshooting', 
    icon: '🔍', 
    relevance: 100 
  },
];

/**
 * Search documentation index
 */
export function searchDocs(query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase();
  const words = normalizedQuery.split(' ').filter(Boolean);
  
  const scored = docsIndex.map(item => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    const categoryLower = item.category.toLowerCase();
    
    // Exact title match (highest priority)
    if (titleLower === normalizedQuery) score += 1000;
    
    // Title contains query
    if (titleLower.includes(normalizedQuery)) score += 500;
    
    // Word matches
    words.forEach(word => {
      if (titleLower.includes(word)) score += 100;
      if (descLower.includes(word)) score += 50;
      if (categoryLower.includes(word)) score += 30;
    });
    
    // Boost by base relevance
    score += item.relevance;
    
    return { ...item, score };
  });
  
  return scored
    .filter(item => item.score > item.relevance)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score, ...item }) => item);
}

/**
 * Get documentation for a specific category
 */
export function getDocsByCategory(category: string): SearchResult[] {
  return docsIndex.filter(doc => 
    doc.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get popular documentation (highest relevance)
 */
export function getPopularDocs(limit = 6): SearchResult[] {
  return [...docsIndex]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
