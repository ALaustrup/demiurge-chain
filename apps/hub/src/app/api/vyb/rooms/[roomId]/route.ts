/**
 * VYB Room Detail API
 * GET /api/vyb/rooms/[roomId] - Get room details
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await chatService.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('[API] Failed to get room:', error);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}
