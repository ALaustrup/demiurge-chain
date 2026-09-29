/**
 * VYB Room Messages API
 * GET  /api/vyb/rooms/[roomId]/messages - Get messages
 * POST /api/vyb/rooms/[roomId]/messages - Send message
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';
import { publishEvent } from '@/lib/vyb/event-bus';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const before = req.nextUrl.searchParams.get('before') || undefined;

    const messages = await chatService.getRoomMessages(roomId, limit, before);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API] Failed to get messages:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { content, type, metadata, replyToId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (content.length > 4000) {
      return NextResponse.json({ error: 'Message too long (max 4000 chars)' }, { status: 400 });
    }

    const message = await chatService.sendMessage(
      roomId,
      qorId,
      content.trim(),
      type || 'text',
      metadata || {},
      replyToId,
    );

    // Publish to SSE stream for real-time delivery
    publishEvent({
      type: 'message',
      roomId: roomId,
      data: message,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === 'Not a member of this room' || msg === 'You are muted in this room') {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error('[API] Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
