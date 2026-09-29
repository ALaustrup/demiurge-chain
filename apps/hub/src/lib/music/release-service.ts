import { qorAuth } from '@demiurge/qor-sdk';
import { MusicRelease, ReleaseType, getReleaseType, getReleaseCost } from '@/lib/vyb/types';

export interface TrackUploadData {
  title: string;
  audioFile?: File;
  audioUri?: string;
  duration: number;
  isExplicit?: boolean;
  lyrics?: string;
}

export interface ReleaseCreationData {
  title: string;
  genre: string;
  description?: string;
  coverArtFile?: File;
  coverArtUri?: string;
  tracks: TrackUploadData[];
  isExplicit?: boolean;
  releaseDate?: Date;
}

export interface ReleaseCreationResult {
  success: boolean;
  releaseId?: string;
  nftId?: string;
  message: string;
}

class ReleaseService {
  private baseUrl = '/api/music';

  private getAuthHeader(): Record<string, string> {
    const token = qorAuth.getToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
  }

  async createRelease(data: ReleaseCreationData): Promise<ReleaseCreationResult> {
    const releaseType = getReleaseType(data.tracks.length);
    const cost = getReleaseCost(releaseType);

    // Upload cover art to IPFS if file provided
    let coverArtUri = data.coverArtUri || '';
    if (data.coverArtFile) {
      const { uploadToIPFS } = await import('@/lib/ipfs-client');
      const result = await uploadToIPFS(data.coverArtFile, data.coverArtFile.name);
      if (!result.success) {
        throw new Error(`Cover art upload failed: ${result.error}`);
      }
      coverArtUri = result.uri || '';
    }

    // Upload tracks to IPFS
    const uploadedTracks = [];
    for (let i = 0; i < data.tracks.length; i++) {
      const track = data.tracks[i];
      let audioUri = track.audioUri || '';
      
      if (track.audioFile) {
        const { uploadToIPFS } = await import('@/lib/ipfs-client');
        const result = await uploadToIPFS(track.audioFile, track.audioFile.name);
        if (!result.success) {
          throw new Error(`Track "${track.title}" upload failed: ${result.error}`);
        }
        audioUri = result.uri || '';
      }
      
      uploadedTracks.push({
        trackNumber: i + 1,
        title: track.title,
        audioUri,
        duration: track.duration,
        isExplicit: track.isExplicit || false,
        lyrics: track.lyrics,
      });
    }

    // Mint as DRC-369 NFT via the mint API
    const mintResponse = await fetch('/api/nft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({
        name: data.title,
        description: data.description || `${releaseType} release: ${data.title}`,
        image: coverArtUri,
        creator: 'self',
        owner: 'self',
        metadata: {
          type: 'music_release',
          releaseType,
          genre: data.genre,
          tracks: uploadedTracks,
          isExplicit: data.isExplicit || false,
          releaseDate: data.releaseDate?.toISOString(),
          mintCost: cost,
        },
      }),
    });

    const mintResult = await mintResponse.json();

    if (!mintResponse.ok || !mintResult.success) {
      throw new Error(mintResult.error || 'Failed to mint release NFT');
    }

    // Also register with the backend if available
    try {
      await fetch(`${this.baseUrl}/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify({
          title: data.title,
          genre: data.genre,
          description: data.description,
          coverArtUri,
          tracks: uploadedTracks,
          releaseType,
          mintCost: cost,
          isExplicit: data.isExplicit || false,
          releaseDate: data.releaseDate?.toISOString(),
          nftId: mintResult.tokenId,
          txHash: mintResult.txHash,
        }),
      });
    } catch {
      // Backend registration is optional — the NFT is already on-chain
      console.warn('Backend release registration unavailable');
    }

    return {
      success: true,
      releaseId: mintResult.tokenId,
      nftId: mintResult.tokenId,
      message: `Release minted on-chain. txHash: ${mintResult.txHash}`,
    };
  }

  async getRelease(releaseId: string): Promise<MusicRelease | null> {
    const response = await fetch(`${this.baseUrl}/release/${releaseId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch release');
    }

    const data = await response.json();
    return data.release || null;
  }

  async getReleases(options?: {
    artistId?: string;
    genre?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ releases: MusicRelease[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.artistId) params.set('artistId', options.artistId);
    if (options?.genre) params.set('genre', options.genre);
    if (options?.featured) params.set('featured', 'true');
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const response = await fetch(`${this.baseUrl}/releases?${params.toString()}`);

    if (!response.ok) {
      return { releases: [], total: 0 };
    }

    const data = await response.json();
    return {
      releases: data.releases || [],
      total: data.total || 0,
    };
  }

  async getFeaturedReleases(): Promise<MusicRelease[]> {
    const { releases } = await this.getReleases({ featured: true, limit: 10 });
    return releases;
  }

  async getNewReleases(limit = 20): Promise<MusicRelease[]> {
    const { releases } = await this.getReleases({ limit });
    return releases;
  }

  async likeRelease(releaseId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/release/${releaseId}/like`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to like release');
    }
  }

  async collectRelease(releaseId: string): Promise<{ success: boolean; nftId?: string }> {
    const response = await fetch(`${this.baseUrl}/release/${releaseId}/collect`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to collect release');
    }

    return response.json();
  }

  // Calculate release cost
  calculateCost(trackCount: number): { type: ReleaseType; cost: number } {
    const type = getReleaseType(trackCount);
    const cost = getReleaseCost(type);
    return { type, cost };
  }
}

export const releaseService = new ReleaseService();
