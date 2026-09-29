/**
 * VYB Direct Messages API
 * GET  /api/vyb/dm - List DM conversations
 * POST /api/vyb/dm - Send a direct message
 */

import { NextRequest, NextResponse } from 'next/server';
import * as chatService from '@/lib/vyb/chat-service';
import { publishEvent } from '@/lib/vyb/event-bus';

export async function GET(req: NextRequest) {
  try {
    const qorId = req.headers.get('x-qor-id');
    if (!qorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversations = await chatService.getDMConversations(qorId);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[API] Failed to get DM conversations:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const qorId = req.headers.get('x-qor-id');
    if (!qorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverQorId, content, type, metadata } = body;

    if (!receiverQorId) {
      return NextResponse.json({ error: 'Receiver is required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (receiverQorId === qorId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    const message = await chatService.sendDirectMessage(
      qorId,
      receiverQorId,
      content.trim(),
      type || 'text',
      metadata || {},
    );

    // Publish to SSE for real-time delivery to receiver
    publishEvent({
      type: 'dm',
      targetQorId: receiverQorId,
      data: message,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to send DM:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
