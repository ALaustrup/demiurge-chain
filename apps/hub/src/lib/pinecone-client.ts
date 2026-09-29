/**
 * Pinecone Vector Database Client for Sophia RAG
 * 
 * Stores and retrieves document embeddings for:
 * - Demiurge whitepapers and documentation
 * - Community guidelines
 * - Lore documents
 * - FAQ entries
 */

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    source: 'whitepaper' | 'lore' | 'rules' | 'faq' | 'docs';
    title: string;
    section?: string;
    version?: string;
    lastUpdated?: string;
  };
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: VectorDocument['metadata'];
}

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
}

class PineconeClient {
  private apiKey: string | null = null;
  private environment: string = 'us-east-1';
  private indexName: string = 'sophia-lore';
  private baseUrl: string = '';
  private initialized: boolean = false;

  constructor() {
    // Load from environment
    this.apiKey = process.env.PINECONE_API_KEY || null;
    this.environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1';
    this.indexName = process.env.PINECONE_INDEX_NAME || 'sophia-lore';

    if (this.apiKey) {
      // Pinecone serverless URL format
      this.baseUrl = `https://${this.indexName}-${this.environment}.svc.pinecone.io`;
    }
  }

  /**
   * Check if Pinecone is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create embeddings using OpenAI
   */
  private async createEmbedding(text: string): Promise<number[]> {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Embedding failed: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Upsert documents to Pinecone
   */
  async upsertDocuments(documents: VectorDocument[]): Promise<{ upsertedCount: number }> {
    if (!this.apiKey) {
      console.warn('Pinecone not configured, skipping upsert');
      return { upsertedCount: 0 };
    }

    // Create embeddings for documents without them
    const vectors = await Promise.all(
      documents.map(async (doc) => {
        const embedding = doc.embedding || await this.createEmbedding(doc.content);
        return {
          id: doc.id,
          values: embedding,
          metadata: {
            ...doc.metadata,
            content: doc.content.slice(0, 8000), // Pinecone metadata limit
          },
        };
      })
    );

    const response = await fetch(`${this.baseUrl}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        vectors,
        namespace: 'demiurge-lore',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinecone upsert failed: ${error.message || response.status}`);
    }

    const data = await response.json();
    return { upsertedCount: data.upsertedCount || vectors.length };
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    options?: {
      topK?: number;
      filter?: Record<string, any>;
      minScore?: number;
    }
  ): Promise<SearchResult[]> {
    const { topK = 5, filter, minScore = 0.7 } = options || {};

    if (!this.apiKey) {
      console.warn('Pinecone not configured, using fallback search');
      return this.fallbackSearch(query, topK);
    }

    // Create query embedding
    const queryEmbedding = await this.createEmbedding(query);

    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        namespace: 'demiurge-lore',
        filter,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinecone query failed: ${error.message || response.status}`);
    }

    const data = await response.json();
    
    return (data.matches || [])
      .filter((match: any) => match.score >= minScore)
      .map((match: any) => ({
        id: match.id,
        score: match.score,
        content: match.metadata.content,
        metadata: {
          source: match.metadata.source,
          title: match.metadata.title,
          section: match.metadata.section,
          version: match.metadata.version,
        },
      }));
  }

  /**
   * Fallback search using keyword matching (when Pinecone not configured)
   */
  private fallbackSearch(query: string, topK: number): SearchResult[] {
    // In-memory fallback with static documents
    const staticDocs: VectorDocument[] = [
      {
        id: 'whitepaper-overview',
        content: 'The Demiurge-Cloud is a next-generation proof-of-stake blockchain designed for gaming, social, and creator economies. It features gasless transactions via the Energy system, native NFT support with the DRC-369 standard, and the Creator God Token (CGT) as its native currency.',
        metadata: { source: 'whitepaper', title: 'Demiurge Overview' },
      },
      {
        id: 'tokenomics',
        content: 'CGT (Creator God Token) has a total supply of 13 billion tokens. 1 CGT = 100 Sparks. Block rewards are 42 CGT per block, targeting approximately 5% annual inflation. Validators stake CGT to participate in consensus and earn rewards.',
        metadata: { source: 'whitepaper', title: 'Tokenomics' },
      },
      {
        id: 'energy-system',
        content: 'The Energy system enables gasless transactions. Users have a regenerating Energy pool (1000 max, 1 per second). Basic transactions cost 10 Energy. Developers can sponsor user transactions by paying Energy costs.',
        metadata: { source: 'whitepaper', title: 'Energy System' },
      },
      {
        id: 'drc-369',
        content: 'DRC-369 is the Demiurge NFT standard. It supports multi-resource assets, soulbound tokens, XP/leveling, and cross-game compatibility. NFTs can have multiple visual representations and utility attributes.',
        metadata: { source: 'docs', title: 'DRC-369 Standard' },
      },
      {
        id: 'community-rules',
        content: 'VYB Community Guidelines: 1) Treat all users with respect. 2) No spam, scams, or phishing. 3) No harassment or hate speech. 4) No illegal content. 5) Mark NSFW content appropriately. Violations result in progressive discipline.',
        metadata: { source: 'rules', title: 'Community Guidelines' },
      },
      {
        id: 'qor-id',
        content: 'QOR ID is the identity system of Demiurge. Each user has a unique identifier (username#number). QOR IDs are linked to on-chain wallets and can hold reputation, achievements, and social connections.',
        metadata: { source: 'docs', title: 'QOR ID System' },
      },
      {
        id: 'staking',
        content: 'Staking on Demiurge allows CGT holders to earn rewards by supporting validators. The minimum stake varies by validator. Rewards are distributed at the end of each Era (approximately every 6 hours).',
        metadata: { source: 'whitepaper', title: 'Staking' },
      },
    ];

    // Simple keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    const scored = staticDocs.map(doc => {
      const contentLower = doc.content.toLowerCase();
      let score = 0;
      queryWords.forEach(word => {
        if (word.length > 3 && contentLower.includes(word)) {
          score += 0.15;
        }
      });
      return { doc, score: Math.min(score, 1) };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => ({
        id: s.doc.id,
        score: s.score,
        content: s.doc.content,
        metadata: s.doc.metadata,
      }));
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.apiKey) return;

    await fetch(`${this.baseUrl}/vectors/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        ids,
        namespace: 'demiurge-lore',
      }),
    });
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{
    totalVectors: number;
    dimension: number;
    namespaces: Record<string, { vectorCount: number }>;
  }> {
    if (!this.apiKey) {
      return {
        totalVectors: 7, // Fallback docs count
        dimension: 1536,
        namespaces: { 'demiurge-lore': { vectorCount: 7 } },
      };
    }

    const response = await fetch(`${this.baseUrl}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to get Pinecone stats');
    }

    return response.json();
  }
}

// Export singleton instance
export const pineconeClient = new PineconeClient();

// Export convenience functions
export const searchLore = (query: string, topK?: number) =>
  pineconeClient.search(query, { topK });

export const indexDocuments = (docs: VectorDocument[]) =>
  pineconeClient.upsertDocuments(docs);
