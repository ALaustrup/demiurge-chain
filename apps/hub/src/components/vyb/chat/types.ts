/**
 * VYB Chat UI Types
 */

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
}

export interface RoomMember {
  qor_id: string;
  display_name?: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';
  is_muted: boolean;
  joined_at: string;
  is_online?: boolean;
}

export interface MiniProfileData {
  qor_id: string;
  display_name: string;
  avatar_url?: string;
  banner_url?: string;
  sex?: string;
  age?: number;
  location?: string;
  bio?: string;
}

export interface DMConversation {
  qor_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}
