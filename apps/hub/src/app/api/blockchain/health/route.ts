import { NextResponse } from 'next/server';
import { blockchainClient } from '@/lib/blockchain';

/**
 * GET /api/blockchain/health
 * Check blockchain node connection status
 */
export async function GET() {
  try {
    // Try to connect to blockchain
    await blockchainClient.connect();
    const api = blockchainClient.getApi();
    
    if (!api || !api.isConnected) {
      return NextResponse.json({
        status: 'disconnected',
        connected: false,
        message: 'Blockchain node is not connected',
        timestamp: new Date().toISOString(),
      });
    }

    // Get chain info
    const [chain, nodeName, nodeVersion, header] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
      api.rpc.chain.getHeader().catch(() => null),
    ]).catch(() => [null, null, null, null]);
    
    const blockNumber = header && 'number' in header ? header.number : null;

    return NextResponse.json({
      status: 'connected',
      connected: true,
      chain: chain?.toString() || 'Unknown',
      nodeName: nodeName?.toString() || 'Unknown',
      nodeVersion: nodeVersion?.toString() || 'Unknown',
      blockNumber: blockNumber?.toNumber() || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
