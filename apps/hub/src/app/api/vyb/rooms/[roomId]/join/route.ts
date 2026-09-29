/**
 * VYB Room Join API
 * POST /api/vyb/rooms/[roomId]/join
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const qorId = req.headers.get('x-qor-id');
    if (!qorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await chatService.joinRoom(roomId, qorId, body.password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to join room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
