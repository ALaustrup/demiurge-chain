import { NextRequest, NextResponse } from 'next/server';
import { blockchainClient } from '@/lib/blockchain';
import { getQorIdFromRequest } from '@/lib/auth-utils';
import { qorAuth } from '@demiurge/qor-sdk';

/**
 * POST /api/blockchain/test
 * Test blockchain integration with a simple balance query
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const qorId = await getQorIdFromRequest(request);
    if (!qorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's on-chain address
    const profile = await qorAuth.getProfile();
    const address = profile.on_chain?.address || profile.on_chain_address;
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'User does not have an on-chain address',
        qorId,
      });
    }

    // Connect to blockchain
    await blockchainClient.connect();
    const api = blockchainClient.getApi();
    
    if (!api || !api.isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Blockchain node is not connected',
        qorId,
        address,
      });
    }

    // Test balance query
    const balanceStr = await blockchainClient.getCGTBalance(address);
    const balanceNum = BigInt(balanceStr);
    const cgtAmount = Number(balanceNum) / 100; // 100 Sparks = 1 CGT

    // Test asset query
    const assets = await blockchainClient.getUserAssets(address);

    // Get blockchain info
    const [chain, header] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.chain.getHeader().catch(() => null),
    ]);

    const blockNumber = header && 'number' in header ? header.number.toNumber() : 0;

    return NextResponse.json({
      success: true,
      qorId,
      address,
      balance: {
        raw: balanceStr,
        cgt: cgtAmount.toFixed(8),
      },
      assets: {
        count: assets.length,
        items: assets.slice(0, 5), // Return first 5 assets
      },
      blockchain: {
        connected: true,
        chain: chain.toString(),
        blockNumber,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
