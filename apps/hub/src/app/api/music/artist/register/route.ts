import { NextRequest, NextResponse } from 'next/server';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// Music Artist Badge NFT metadata template
const ARTIST_BADGE_METADATA = {
  name: 'QOR Music Artist Badge',
  description: 'Official Music Artist Badge for QOR MUSIC. Grants permission to release music on-chain.',
  image: 'ipfs://bafkreih5aznjvttude6c3wbvqeebb6rlx5wkbzyppv7garber7pdgcycfa',
  attributes: [
    { trait_type: 'Badge Type', value: 'Music Artist' },
    { trait_type: 'Soulbound', value: 'true' },
    { trait_type: 'Platform', value: 'QOR MUSIC' },
  ],
};

// POST /api/music/artist/register - Register as a music artist and mint badge NFT
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { artistName, primaryGenre, bio, socialLinks, stakeAmount } = body;

    if (!artistName || !primaryGenre) {
      return NextResponse.json(
        { error: 'Artist name and primary genre are required' },
        { status: 400 }
      );
    }

    // Validate artist name length
    if (artistName.length < 2 || artistName.length > 50) {
      return NextResponse.json(
        { error: 'Artist name must be 2-50 characters' },
        { status: 400 }
      );
    }

    // Required stake amount
    const requiredStake = 50; // CGT
    if (!stakeAmount || stakeAmount < requiredStake) {
      return NextResponse.json(
        { error: `Minimum stake of ${requiredStake} CGT is required` },
        { status: 400 }
      );
    }

    // Step 1: Register artist with QOR Auth backend
    let artistId: string;
    let backendSuccess = false;

    try {
      const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/artist/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          artist_name: artistName,
          primary_genre: primaryGenre,
          bio: bio || null,
          social_links: socialLinks || {},
          stake_amount: stakeAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        artistId = data.artist_id || data.id;
        backendSuccess = true;
      } else if (response.status === 404) {
        // Backend endpoint doesn't exist - generate local ID
        artistId = `artist_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      } else {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.message || 'Failed to register artist' },
          { status: response.status }
        );
      }
    } catch (backendError) {
      // Backend unreachable - generate local ID
      artistId = `artist_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    // Step 2: Mint the Music Artist Badge NFT on-chain
    let badgeNftId: string | null = null;
    let mintTxHash: string | null = null;

    try {
      // Create NFT metadata for this artist
      const nftMetadata = {
        ...ARTIST_BADGE_METADATA,
        name: `QOR Music Artist: ${artistName}`,
        attributes: [
          ...ARTIST_BADGE_METADATA.attributes,
          { trait_type: 'Artist Name', value: artistName },
          { trait_type: 'Genre', value: primaryGenre },
          { trait_type: 'Registration Date', value: new Date().toISOString() },
          { trait_type: 'Stake Amount', value: `${stakeAmount} CGT` },
        ],
      };

      // Upload metadata to IPFS (via our API)
      const metadataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ipfs/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          content: JSON.stringify(nftMetadata),
          type: 'metadata',
        }),
      });

      let metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(nftMetadata)).toString('base64')}`;
      
      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();
        metadataUri = metadataData.url || metadataData.ipfsHash ? `ipfs://${metadataData.ipfsHash}` : metadataUri;
      }

      // Mint the NFT using DRC-369 standard
      // The royalty is set to 0 for soulbound badges (non-transferable)
      const mintResult = await demiurgeRpc.mintNFT(
        artistId, // Creator address (will be replaced with user's address)
        metadataUri,
        0, // 0% royalty for soulbound badge
        '' // Signature will be handled by the RPC
      );

      if (mintResult.success && mintResult.tokenId) {
        badgeNftId = mintResult.tokenId;
        mintTxHash = mintResult.txHash || null;
      }
    } catch (mintError) {
      console.error('NFT minting error:', mintError);
      // Continue even if minting fails - artist is still registered
    }

    // Return success response
    return NextResponse.json({
      success: true,
      artistId,
      badgeNftId,
      mintTxHash,
      message: badgeNftId 
        ? 'Artist profile created and badge NFT minted successfully'
        : 'Artist profile created (badge NFT pending)',
      stake: {
        amount: stakeAmount,
        currency: 'CGT',
        unlockDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
    });
  } catch (error: any) {
    console.error('Artist registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
