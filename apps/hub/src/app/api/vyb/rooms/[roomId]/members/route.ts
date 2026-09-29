/**
 * VYB Room Members API
 * GET /api/vyb/rooms/[roomId]/members - Get members list
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const members = await chatService.getRoomMembers(roomId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('[API] Failed to get members:', error);
    return NextResponse.json({ error: 'Failed to get members' }, { status: 500 });
  }
}
