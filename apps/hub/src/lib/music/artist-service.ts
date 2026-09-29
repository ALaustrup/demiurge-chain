import { qorAuth } from '@demiurge/qor-sdk';
import { MusicArtistProfile, MusicRelease } from '@/lib/vyb/types';

export interface ArtistRegistrationData {
  artistName: string;
  primaryGenre: string;
  bio?: string;
  socialLinks?: {
    soundcloud?: string;
    spotify?: string;
    appleMusic?: string;
    bandcamp?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface ArtistRegistrationResult {
  success: boolean;
  artistId?: string;
  badgeNftId?: string;
  message: string;
}

class ArtistService {
  private baseUrl = '/api/music';

  private getAuthHeader(): Record<string, string> {
    const token = qorAuth.getToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
  }

  async register(data: ArtistRegistrationData): Promise<ArtistRegistrationResult> {
    const response = await fetch(`${this.baseUrl}/artist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to register as artist');
    }

    return result;
  }

  async getCurrentArtist(): Promise<MusicArtistProfile | null> {
    const response = await fetch(`${this.baseUrl}/artist`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      if (response.status === 401) return null;
      throw new Error('Failed to fetch artist profile');
    }

    const data = await response.json();
    return data.artist || null;
  }

  async getArtist(artistId: string): Promise<MusicArtistProfile | null> {
    const response = await fetch(`${this.baseUrl}/artist/${artistId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch artist');
    }

    const data = await response.json();
    return data.artist || null;
  }

  async getArtistReleases(artistId: string): Promise<MusicRelease[]> {
    const response = await fetch(`${this.baseUrl}/releases?artistId=${artistId}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.releases || [];
  }

  async followArtist(artistId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/artist/${artistId}/follow`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to follow artist');
    }
  }

  async unfollowArtist(artistId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/artist/${artistId}/follow`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to unfollow artist');
    }
  }

  async reportArtist(artistId: string, reason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/artist/${artistId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to report artist');
    }
  }
}

export const artistService = new ArtistService();
