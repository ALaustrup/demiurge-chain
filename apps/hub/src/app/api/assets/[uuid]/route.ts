import { NextRequest, NextResponse } from 'next/server';
import { blockchainClient } from '@/lib/blockchain';

/**
 * GET /api/assets/:uuid
 * Get full metadata for a specific DRC-369 asset
 * 
 * This endpoint queries the blockchain for asset metadata including:
 * - Core identity (name, creator, owner)
 * - Stateful properties (XP, durability, kill count)
 * - Metadata (resources, attributes, nesting info)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    
    if (!uuid) {
      return NextResponse.json(
        { error: 'Asset UUID required' },
        { status: 400 }
      );
    }

    // Ensure blockchain connection
    if (!blockchainClient.isConnected()) {
      await blockchainClient.connect();
    }

    // Query blockchain for asset metadata
    // This queries pallet-drc369.assets(uuid) storage
    const api = blockchainClient.getApi();
    if (!api) {
      throw new Error('Blockchain API not available');
    }

    try {
      // Query asset metadata from pallet-drc369
      const assetData = await api.query.drc369.assets(uuid);
      
      if (!assetData || assetData.isEmpty) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Convert to human-readable format
      const assetRaw = assetData.toHuman() as Record<string, any>;
      
      // Format the response
      const formattedAsset = {
        uuid: uuid,
        name: (typeof assetRaw?.name === 'string' ? assetRaw.name : 'Unknown') || 'Unknown',
        creatorQorId: (typeof assetRaw?.creator_qor_id === 'string' ? assetRaw.creator_qor_id : '') || '',
        creatorAccount: (typeof assetRaw?.creator_account === 'string' ? assetRaw.creator_account : '') || '',
        owner: (typeof assetRaw?.owner === 'string' ? assetRaw.owner : '') || '',
        assetType: 'virtual', // Default, can be determined from metadata
        xpLevel: (assetRaw?.level as number) || 0,
        experiencePoints: (assetRaw?.experience_points as number) || 0,
        durability: (assetRaw?.durability as number) || 100,
        killCount: (assetRaw?.kill_count as number) || 0,
        classId: (assetRaw?.class_id as number) || 0,
        isSoulbound: (assetRaw?.is_soulbound as boolean) || false,
        royaltyFeePercent: (assetRaw?.royalty_fee_percent as number) || 0,
        mintedAt: (assetRaw?.minted_at as number) || 0,
        metadata: {
          description: (assetRaw?.description as string) || '',
          image: (assetRaw?.image as string) || '',
          attributes: (assetRaw?.attributes as Record<string, any>) || {},
          // Multi-Resource (Module 1)
          resources: (assetRaw?.resources as any[]) || [],
          // Nesting (Module 2)
          parentUuid: (assetRaw?.parent_uuid as string) || null,
          childrenUuids: (assetRaw?.children_uuids as string[]) || [],
          equipmentSlots: (assetRaw?.equipment_slots as any[]) || [],
          // Delegation (Module 3)
          delegation: (assetRaw?.delegation as any) || null,
          // Custom state (Module 4)
          customState: (assetRaw?.custom_state as Record<string, any>) || {}
        }
      };

      return NextResponse.json({ asset: formattedAsset });
    } catch (queryError: any) {
      console.error('Failed to query asset from blockchain:', queryError);
      
      // If query fails, return a helpful error
      return NextResponse.json(
        { 
          error: 'Failed to query asset from blockchain',
          details: queryError.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}
