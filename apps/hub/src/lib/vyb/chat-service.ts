/**
 * VYB Chat Service
 * 
 * Business logic for chat rooms, messages, and direct messaging.
 * Backed by PostgreSQL via the shared db module.
 */

import { query, queryOne, execute, transaction } from '../db';
import crypto from 'crypto';

// ============ Types ============

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'global' | 'public' | 'private';
  has_password: boolean;
  creator_qor_id: string;
  max_members: number;
  is_permanent: boolean;
  member_count: number;
  online_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_qor_id: string;
  sender_display_name?: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'media' | 'system' | 'tip';
  metadata: Record<string, any>;
  reply_to_id: string | null;
  reply_preview?: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface RoomMember {
  qor_id: string;
  display_name?: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';
  is_muted: boolean;
  joined_at: string;
  last_read_at: string;
  is_online?: boolean;
}

export interface DirectMessage {
  id: string;
  sender_qor_id: string;
  receiver_qor_id: string;
  sender_display_name?: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'media' | 'tip';
  metadata: Record<string, any>;
  created_at: string;
  read_at: string | null;
}

export interface DMConversation {
  qor_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// ============ Rooms ============

/**
 * List available chat rooms with member counts
 */
export async function listRooms(search?: string): Promise<ChatRoom[]> {
  let sql = `
    SELECT r.*, 
           COUNT(DISTINCT rm.qor_id) as member_count,
           0 as online_count
    FROM vyb_rooms r
    LEFT JOIN vyb_room_members rm ON r.id = rm.room_id
  `;
  const params: any[] = [];
  
  if (search) {
    sql += ` WHERE LOWER(r.name) LIKE $1 OR LOWER(r.description) LIKE $1`;
    params.push(`%${search.toLowerCase()}%`);
  }
  
  sql += ` GROUP BY r.id ORDER BY r.is_permanent DESC, member_count DESC, r.created_at DESC`;
  
  const rooms = await query<any>(sql, params);
  return rooms.map(r => ({
    ...r,
    member_count: parseInt(r.member_count) || 0,
    online_count: parseInt(r.online_count) || 0,
    has_password: !!r.password_hash,
  }));
}

/**
 * Get rooms that a user has joined
 */
export async function getUserRooms(qorId: string): Promise<ChatRoom[]> {
  const rooms = await query<any>(`
    SELECT r.*, 
           COUNT(DISTINCT rm2.qor_id) as member_count,
           0 as online_count
    FROM vyb_rooms r
    INNER JOIN vyb_room_members rm ON r.id = rm.room_id AND rm.qor_id = $1
    LEFT JOIN vyb_room_members rm2 ON r.id = rm2.room_id
    GROUP BY r.id
    ORDER BY r.is_permanent DESC, r.name ASC
  `, [qorId]);
  
  return rooms.map(r => ({
    ...r,
    member_count: parseInt(r.member_count) || 0,
    online_count: parseInt(r.online_count) || 0,
    has_password: !!r.password_hash,
  }));
}

/**
 * Get room details by ID
 */
export async function getRoom(roomId: string): Promise<ChatRoom | null> {
  return queryOne<ChatRoom>(`
    SELECT r.*, 
           COUNT(DISTINCT rm.qor_id) as member_count,
           0 as online_count
    FROM vyb_rooms r
    LEFT JOIN vyb_room_members rm ON r.id = rm.room_id
    WHERE r.id = $1
    GROUP BY r.id
  `, [roomId]);
}

/**
 * Create a new chat room
 */
export async function createRoom(
  name: string,
  description: string,
  type: 'public' | 'private',
  creatorQorId: string,
  password?: string,
  maxMembers?: number,
): Promise<ChatRoom> {
  const passwordHash = password 
    ? crypto.createHash('sha256').update(password).digest('hex') 
    : null;

  const room = await execute<ChatRoom>(`
    INSERT INTO vyb_rooms (name, description, type, password_hash, creator_qor_id, max_members)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, description, type, passwordHash, creatorQorId, maxMembers || 200]);

  if (room) {
    // Auto-join creator as owner
    await execute(`
      INSERT INTO vyb_room_members (room_id, qor_id, role) VALUES ($1, $2, 'owner')
    `, [room.id, creatorQorId]);
  }

  return room!;
}

/**
 * Join a chat room
 */
export async function joinRoom(roomId: string, qorId: string, password?: string): Promise<{ success: boolean; error?: string }> {
  const room = await queryOne<any>(`SELECT * FROM vyb_rooms WHERE id = $1`, [roomId]);
  if (!room) return { success: false, error: 'Room not found' };

  // Check password for private rooms
  if (room.password_hash && password) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== room.password_hash) return { success: false, error: 'Incorrect password' };
  } else if (room.password_hash && !password) {
    return { success: false, error: 'Password required' };
  }

  // Check capacity
  const [{ count }] = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM vyb_room_members WHERE room_id = $1
  `, [roomId]);
  if (parseInt(count) >= room.max_members) return { success: false, error: 'Room is full' };

  // Join (upsert)
  await execute(`
    INSERT INTO vyb_room_members (room_id, qor_id, role)
    VALUES ($1, $2, 'member')
    ON CONFLICT (room_id, qor_id) DO NOTHING
  `, [roomId, qorId]);

  return { success: true };
}

/**
 * Leave a chat room
 */
export async function leaveRoom(roomId: string, qorId: string): Promise<void> {
  // Don't allow leaving permanent global rooms (just remove membership)
  await execute(`
    DELETE FROM vyb_room_members WHERE room_id = $1 AND qor_id = $2
  `, [roomId, qorId]);
}

/**
 * Get room members
 */
export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  return query<RoomMember>(`
    SELECT rm.qor_id, rm.role, rm.is_muted, rm.joined_at, rm.last_read_at,
           p.display_name, p.avatar_url
    FROM vyb_room_members rm
    LEFT JOIN vyb_profiles p ON rm.qor_id = p.qor_id
    WHERE rm.room_id = $1
    ORDER BY 
      CASE rm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
      rm.joined_at ASC
  `, [roomId]);
}

// ============ Messages ============

/**
 * Send a message to a room
 */
export async function sendMessage(
  roomId: string,
  senderQorId: string,
  content: string,
  type: 'text' | 'media' | 'system' | 'tip' = 'text',
  metadata: Record<string, any> = {},
  replyToId?: string,
): Promise<ChatMessage> {
  // Verify membership
  const member = await queryOne<any>(`
    SELECT * FROM vyb_room_members WHERE room_id = $1 AND qor_id = $2
  `, [roomId, senderQorId]);
  
  if (!member) throw new Error('Not a member of this room');
  if (member.is_muted) throw new Error('You are muted in this room');

  const message = await execute<ChatMessage>(`
    INSERT INTO vyb_messages (room_id, sender_qor_id, content, type, metadata, reply_to_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [roomId, senderQorId, content, type, JSON.stringify(metadata), replyToId || null]);

  // Update last_read_at for sender
  await execute(`
    UPDATE vyb_room_members SET last_read_at = NOW() WHERE room_id = $1 AND qor_id = $2
  `, [roomId, senderQorId]);

  return message!;
}

/**
 * Get messages for a room (paginated, newest first)
 */
export async function getRoomMessages(
  roomId: string,
  limit: number = 50,
  before?: string,
): Promise<ChatMessage[]> {
  let sql = `
    SELECT m.*, 
           p.display_name as sender_display_name, 
           p.avatar_url as sender_avatar,
           r.content as reply_preview
    FROM vyb_messages m
    LEFT JOIN vyb_profiles p ON m.sender_qor_id = p.qor_id
    LEFT JOIN vyb_messages r ON m.reply_to_id = r.id
    WHERE m.room_id = $1 AND m.deleted_at IS NULL
  `;
  const params: any[] = [roomId];

  if (before) {
    sql += ` AND m.created_at < $${params.length + 1}`;
    params.push(before);
  }

  sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  return query<ChatMessage>(sql, params);
}

/**
 * Get unread count for a user in a room
 */
export async function getUnreadCount(roomId: string, qorId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(`
    SELECT COUNT(*) as count FROM vyb_messages m
    INNER JOIN vyb_room_members rm ON m.room_id = rm.room_id AND rm.qor_id = $2
    WHERE m.room_id = $1 AND m.created_at > rm.last_read_at AND m.sender_qor_id != $2
  `, [roomId, qorId]);
  return parseInt(result?.count || '0');
}

/**
 * Mark room as read
 */
export async function markRoomRead(roomId: string, qorId: string): Promise<void> {
  await execute(`
    UPDATE vyb_room_members SET last_read_at = NOW() WHERE room_id = $1 AND qor_id = $2
  `, [roomId, qorId]);
}

// ============ Moderation ============

/**
 * Kick a user from a room (admin/owner only)
 */
export async function kickMember(roomId: string, targetQorId: string, actorQorId: string): Promise<{ success: boolean; error?: string }> {
  const actor = await queryOne<any>(`
    SELECT role FROM vyb_room_members WHERE room_id = $1 AND qor_id = $2
  `, [roomId, actorQorId]);

  if (!actor || (actor.role !== 'owner' && actor.role !== 'admin')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  await execute(`DELETE FROM vyb_room_members WHERE room_id = $1 AND qor_id = $2`, [roomId, targetQorId]);
  
  // Add system message
  await sendMessage(roomId, 'system', `${targetQorId} was removed from the room`, 'system');
  
  return { success: true };
}

/**
 * Toggle mute for a user in a room
 */
export async function toggleMute(roomId: string, targetQorId: string, actorQorId: string): Promise<{ success: boolean; muted?: boolean }> {
  const actor = await queryOne<any>(`
    SELECT role FROM vyb_room_members WHERE room_id = $1 AND qor_id = $2
  `, [roomId, actorQorId]);

  if (!actor || (actor.role !== 'owner' && actor.role !== 'admin')) {
    return { success: false };
  }

  const result = await execute<any>(`
    UPDATE vyb_room_members SET is_muted = NOT is_muted WHERE room_id = $1 AND qor_id = $2
    RETURNING is_muted
  `, [roomId, targetQorId]);

  return { success: true, muted: result?.is_muted };
}

// ============ Direct Messages ============

/**
 * Send a direct message
 */
export async function sendDirectMessage(
  senderQorId: string,
  receiverQorId: string,
  content: string,
  type: 'text' | 'media' | 'tip' = 'text',
  metadata: Record<string, any> = {},
): Promise<DirectMessage> {
  const dm = await execute<DirectMessage>(`
    INSERT INTO vyb_direct_messages (sender_qor_id, receiver_qor_id, content, type, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [senderQorId, receiverQorId, content, type, JSON.stringify(metadata)]);

  return dm!;
}

/**
 * Get DM conversations for a user
 */
export async function getDMConversations(qorId: string): Promise<DMConversation[]> {
  return query<DMConversation>(`
    WITH latest_msgs AS (
      SELECT DISTINCT ON (peer)
        CASE WHEN sender_qor_id = $1 THEN receiver_qor_id ELSE sender_qor_id END as peer,
        content as last_message,
        created_at as last_message_at
      FROM vyb_direct_messages
      WHERE sender_qor_id = $1 OR receiver_qor_id = $1
      ORDER BY peer, created_at DESC
    ),
    unread_counts AS (
      SELECT sender_qor_id as peer, COUNT(*) as unread_count
      FROM vyb_direct_messages
      WHERE receiver_qor_id = $1 AND read_at IS NULL
      GROUP BY sender_qor_id
    )
    SELECT 
      lm.peer as qor_id,
      COALESCE(p.display_name, lm.peer) as display_name,
      p.avatar_url,
      lm.last_message,
      lm.last_message_at,
      COALESCE(uc.unread_count, 0) as unread_count
    FROM latest_msgs lm
    LEFT JOIN vyb_profiles p ON lm.peer = p.qor_id
    LEFT JOIN unread_counts uc ON lm.peer = uc.peer
    ORDER BY lm.last_message_at DESC
  `, [qorId]);
}

/**
 * Get DM history between two users
 */
export async function getDMHistory(
  qorId: string,
  peerQorId: string,
  limit: number = 50,
  before?: string,
): Promise<DirectMessage[]> {
  let sql = `
    SELECT dm.*, 
           p.display_name as sender_display_name, 
           p.avatar_url as sender_avatar
    FROM vyb_direct_messages dm
    LEFT JOIN vyb_profiles p ON dm.sender_qor_id = p.qor_id
    WHERE (dm.sender_qor_id = $1 AND dm.receiver_qor_id = $2)
       OR (dm.sender_qor_id = $2 AND dm.receiver_qor_id = $1)
  `;
  const params: any[] = [qorId, peerQorId];

  if (before) {
    sql += ` AND dm.created_at < $${params.length + 1}`;
    params.push(before);
  }

  sql += ` ORDER BY dm.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  // Mark messages as read
  await execute(`
    UPDATE vyb_direct_messages SET read_at = NOW()
    WHERE receiver_qor_id = $1 AND sender_qor_id = $2 AND read_at IS NULL
  `, [qorId, peerQorId]);

  return query<DirectMessage>(sql, params);
}
