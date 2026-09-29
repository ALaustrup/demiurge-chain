/**
 * Chain Mint — DEPRECATED
 * 
 * All minting now goes through /api/nft/mint which writes directly
 * to the blockchain via the drc369_mint RPC call.
 * 
 * This endpoint redirects callers to the canonical mint route.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint has been deprecated. Use /api/nft/mint instead.',
      redirect: '/api/nft/mint',
    },
    { status: 410 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint has been deprecated. Use /api/nft/mint instead.',
      redirect: '/api/nft/mint',
    },
    { status: 410 }
  );
}
