'use client';

import { useState, useCallback, useEffect } from 'react';
import { useChatAPI } from './useChatAPI';
import { RoomList } from './RoomList';
import { RoomTabs } from './RoomTabs';
import { ChatRoom } from './ChatRoom';
import { RoomSettings } from './RoomSettings';
import { DirectMessage } from './DirectMessage';
import type { ChatRoom as ChatRoomType } from './types';

export function ChatLayout() {
  const { qorId, joinRoom, getUserRooms } = useChatAPI();
  const [openRooms, setOpenRooms] = useState<ChatRoomType[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showDMs, setShowDMs] = useState(false);
  const [dmPeer, setDmPeer] = useState<string | undefined>();
  const [passwordPrompt, setPasswordPrompt] = useState<{ room: ChatRoomType; value: string } | null>(null);

  // Auto-join and open default global rooms on mount
  useEffect(() => {
    if (!qorId) return;
    loadUserRooms();
  }, [qorId]);

  const loadUserRooms = async () => {
    try {
      const rooms = await getUserRooms();
      if (rooms.length > 0) {
        setOpenRooms(rooms);
        setActiveRoomId(rooms[0].id);
      }
    } catch {}
  };

  const handleSelectRoom = useCallback(async (room: ChatRoomType) => {
    // If room requires password and user isn't already in
    if (room.has_password) {
      setPasswordPrompt({ room, value: '' });
      return;
    }

    // Auto-join
    try {
      await joinRoom(room.id);
    } catch {}

    // Open tab
    setOpenRooms(prev => {
      if (prev.some(r => r.id === room.id)) return prev;
      return [...prev, room];
    });
    setActiveRoomId(room.id);
    setShowDMs(false);
  }, [joinRoom]);

  const handleJoinWithPassword = async () => {
    if (!passwordPrompt) return;
    try {
      await joinRoom(passwordPrompt.room.id, passwordPrompt.value);
      setOpenRooms(prev => {
        if (prev.some(r => r.id === passwordPrompt.room.id)) return prev;
        return [...prev, passwordPrompt.room];
      });
      setActiveRoomId(passwordPrompt.room.id);
      setPasswordPrompt(null);
      setShowDMs(false);
    } catch (error) {
      // Password prompt stays open, user can retry
    }
  };

  const handleCloseRoom = useCallback((roomId: string) => {
    setOpenRooms(prev => prev.filter(r => r.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(openRooms.find(r => r.id !== roomId)?.id || '');
    }
    setUnreadCounts(prev => {
      const { [roomId]: _, ...rest } = prev;
      return rest;
    });
  }, [activeRoomId, openRooms]);

  const handleRoomCreated = (room: ChatRoomType) => {
    setShowCreateRoom(false);
    setOpenRooms(prev => [...prev, room]);
    setActiveRoomId(room.id);
    setShowDMs(false);
  };

  const handleDM = (peerQorId: string) => {
    setDmPeer(peerQorId);
    setShowDMs(true);
  };

  const activeRoom = openRooms.find(r => r.id === activeRoomId);

  return (
    <div className="flex flex-col h-full border border-gray-800 rounded-xl overflow-hidden bg-architect-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-architect-surface/50">
        <RoomList
          onSelectRoom={handleSelectRoom}
          onCreateRoom={() => setShowCreateRoom(true)}
          activeRoomId={activeRoomId}
        />

        <div className="flex-1" />

        <button
          onClick={() => { setShowDMs(true); setDmPeer(undefined); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showDMs ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' : 'glass-panel hover:border-neon-cyan/30 text-gray-300'
          }`}
        >
          💬 <span className="hidden md:inline">DMs</span>
        </button>
      </div>

      {/* Room Tabs */}
      {!showDMs && (
        <RoomTabs
          openRooms={openRooms}
          activeRoomId={activeRoomId}
          unreadCounts={unreadCounts}
          onSelectRoom={(id) => { setActiveRoomId(id); setShowDMs(false); }}
          onCloseRoom={handleCloseRoom}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex">
        {showDMs ? (
          <DirectMessage
            peerQorId={dmPeer}
            onBack={() => setShowDMs(false)}
          />
        ) : activeRoom ? (
          <ChatRoom
            roomId={activeRoom.id}
            roomName={activeRoom.name}
            onDM={handleDM}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-lg font-medium">VYB Chat</p>
            <p className="text-sm text-gray-600 mt-1">Select a room from the dropdown to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <RoomSettings
          onClose={() => setShowCreateRoom(false)}
          onCreated={handleRoomCreated}
        />
      )}

      {/* Password Prompt Modal */}
      {passwordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPasswordPrompt(null)}>
          <div className="glass-panel w-full max-w-sm rounded-xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-medium mb-2">🔒 Private Room</h3>
            <p className="text-gray-400 text-sm mb-4">Enter the password for <span className="text-white">{passwordPrompt.room.name}</span></p>
            <input
              type="password"
              value={passwordPrompt.value}
              onChange={(e) => setPasswordPrompt(prev => prev ? { ...prev, value: e.target.value } : null)}
              placeholder="Password"
              className="w-full bg-architect-input border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:border-neon-cyan/50 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinWithPassword()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setPasswordPrompt(null)} className="flex-1 glass-panel py-2 rounded-lg text-sm text-gray-300">Cancel</button>
              <button onClick={handleJoinWithPassword} className="flex-1 py-2 rounded-lg text-sm bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
