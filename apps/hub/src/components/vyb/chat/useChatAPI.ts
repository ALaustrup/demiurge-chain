/**
 * VYB Chat API Hook
 * Centralizes all chat API calls with authentication
 */

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatRoom, ChatMessage, RoomMember, DMConversation, MiniProfileData } from './types';

const API_BASE = '/api/vyb';

function getHeaders(qorId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-qor-id': qorId,
  };
}

export function useChatAPI() {
  const { user } = useAuth();
  const qorId = user?.qor_id || '';

  const listRooms = useCallback(async (search?: string): Promise<ChatRoom[]> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE}/rooms?${params}`, { headers: getHeaders(qorId) });
    const data = await res.json();
    return data.rooms || [];
  }, [qorId]);

  const getUserRooms = useCallback(async (): Promise<ChatRoom[]> => {
    const res = await fetch(`${API_BASE}/rooms?mine=true`, { headers: getHeaders(qorId) });
    const data = await res.json();
    return data.rooms || [];
  }, [qorId]);

  const createRoom = useCallback(async (name: string, description: string, type: string, password?: string): Promise<ChatRoom> => {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getHeaders(qorId),
      body: JSON.stringify({ name, description, type, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.room;
  }, [qorId]);

  const joinRoom = useCallback(async (roomId: string, password?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: getHeaders(qorId),
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
  }, [qorId]);

  const leaveRoom = useCallback(async (roomId: string): Promise<void> => {
    await fetch(`${API_BASE}/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: getHeaders(qorId),
    });
  }, [qorId]);

  const getMessages = useCallback(async (roomId: string, before?: string): Promise<ChatMessage[]> => {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    const res = await fetch(`${API_BASE}/rooms/${roomId}/messages?${params}`, { headers: getHeaders(qorId) });
    const data = await res.json();
    return data.messages || [];
  }, [qorId]);

  const sendMessage = useCallback(async (roomId: string, content: string, replyToId?: string): Promise<ChatMessage> => {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getHeaders(qorId),
      body: JSON.stringify({ content, replyToId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.message;
  }, [qorId]);

  const getMembers = useCallback(async (roomId: string): Promise<RoomMember[]> => {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/members`, { headers: getHeaders(qorId) });
    const data = await res.json();
    return data.members || [];
  }, [qorId]);

  const getDMConversations = useCallback(async (): Promise<DMConversation[]> => {
    const res = await fetch(`${API_BASE}/dm`, { headers: getHeaders(qorId) });
    const data = await res.json();
    return data.conversations || [];
  }, [qorId]);

  const getDMHistory = useCallback(async (peerQorId: string, before?: string): Promise<ChatMessage[]> => {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    const res = await fetch(`${API_BASE}/dm/${encodeURIComponent(peerQorId)}?${params}`, { headers: getHeaders(qorId) });
    const data = await res.json();
    return data.messages || [];
  }, [qorId]);

  const sendDM = useCallback(async (receiverQorId: string, content: string): Promise<ChatMessage> => {
    const res = await fetch(`${API_BASE}/dm`, {
      method: 'POST',
      headers: getHeaders(qorId),
      body: JSON.stringify({ receiverQorId, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.message;
  }, [qorId]);

  const getProfile = useCallback(async (profileQorId: string): Promise<MiniProfileData | null> => {
    const res = await fetch(`${API_BASE}/profile/${encodeURIComponent(profileQorId)}`);
    const data = await res.json();
    return data.profile || null;
  }, []);

  return {
    qorId,
    listRooms,
    getUserRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    getMessages,
    sendMessage,
    getMembers,
    getDMConversations,
    getDMHistory,
    sendDM,
    getProfile,
  };
}
