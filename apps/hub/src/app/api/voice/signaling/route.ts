/**
 * WebRTC Signaling API Route
 * 
 * Handles signaling for WebRTC peer-to-peer voice chat.
 * Uses Server-Sent Events (SSE) for real-time updates.
 * 
 * For production, this should be replaced with:
 * - WebSocket server (e.g., Socket.io)
 * - Redis pub/sub for multi-instance support
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for active rooms and pending signals
// NOTE: This only works for single-server deployment
// For production, use Redis or a real-time database
interface RoomParticipant {
  oderId: string;
  joinedAt: number;
  lastSeen: number;
}

interface PendingSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  payload: any;
  timestamp: number;
}

interface VoiceRoom {
  id: string;
  participants: Map<string, RoomParticipant>;
  pendingSignals: PendingSignal[];
  createdAt: number;
}

// Global room storage (will reset on server restart)
const rooms = new Map<string, VoiceRoom>();

// Cleanup old rooms periodically (rooms idle for 30 minutes)
const ROOM_TIMEOUT = 30 * 60 * 1000;
const SIGNAL_TIMEOUT = 30 * 1000; // Signals expire after 30 seconds

function cleanupRooms() {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    // Remove stale participants
    for (const [userId, participant] of room.participants.entries()) {
      if (now - participant.lastSeen > ROOM_TIMEOUT) {
        room.participants.delete(userId);
      }
    }
    
    // Remove expired signals
    room.pendingSignals = room.pendingSignals.filter(
      signal => now - signal.timestamp < SIGNAL_TIMEOUT
    );
    
    // Remove empty rooms
    if (room.participants.size === 0) {
      rooms.delete(roomId);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRooms, 60 * 1000);

function getOrCreateRoom(roomId: string): VoiceRoom {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      participants: new Map(),
      pendingSignals: [],
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

/**
 * POST - Handle signaling messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, userId, targetUserId, signalType, payload } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'roomId and userId are required' },
        { status: 400 }
      );
    }

    const room = getOrCreateRoom(roomId);

    switch (action) {
      case 'join': {
        // Add participant to room
        room.participants.set(userId, {
          oderId: userId,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        });

        // Get other participants
        const otherParticipants = Array.from(room.participants.keys())
          .filter(id => id !== userId);

        return NextResponse.json({
          success: true,
          participants: otherParticipants,
          roomId,
        });
      }

      case 'leave': {
        room.participants.delete(userId);
        
        // Remove any pending signals from/to this user
        room.pendingSignals = room.pendingSignals.filter(
          s => s.from !== userId && s.to !== userId
        );

        return NextResponse.json({ success: true });
      }

      case 'signal': {
        if (!targetUserId || !signalType || !payload) {
          return NextResponse.json(
            { error: 'targetUserId, signalType, and payload are required for signaling' },
            { status: 400 }
          );
        }

        // Update sender's last seen
        const participant = room.participants.get(userId);
        if (participant) {
          participant.lastSeen = Date.now();
        }

        // Add signal to pending queue
        room.pendingSignals.push({
          type: signalType,
          from: userId,
          to: targetUserId,
          payload,
          timestamp: Date.now(),
        });

        return NextResponse.json({ success: true });
      }

      case 'poll': {
        // Update last seen
        const participant = room.participants.get(userId);
        if (participant) {
          participant.lastSeen = Date.now();
        }

        // Get pending signals for this user
        const signals = room.pendingSignals.filter(s => s.to === userId);
        
        // Remove retrieved signals
        room.pendingSignals = room.pendingSignals.filter(s => s.to !== userId);

        // Get current participants
        const participants = Array.from(room.participants.keys())
          .filter(id => id !== userId);

        return NextResponse.json({
          signals,
          participants,
        });
      }

      case 'heartbeat': {
        // Just update last seen
        const participant = room.participants.get(userId);
        if (participant) {
          participant.lastSeen = Date.now();
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[Signaling] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Signaling error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get room info
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    // Return list of active rooms (for debugging/admin)
    const activeRooms = Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      participantCount: room.participants.size,
      createdAt: room.createdAt,
    }));
    return NextResponse.json({ rooms: activeRooms });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return NextResponse.json({ 
      exists: false, 
      participants: [] 
    });
  }

  return NextResponse.json({
    exists: true,
    participants: Array.from(room.participants.keys()),
    createdAt: room.createdAt,
  });
}
