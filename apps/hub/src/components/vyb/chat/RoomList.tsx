'use client';

import { useState, useEffect } from 'react';
import { useChatAPI } from './useChatAPI';
import type { ChatRoom } from './types';

interface RoomListProps {
  onSelectRoom: (room: ChatRoom) => void;
  onCreateRoom: () => void;
  activeRoomId?: string;
}

export function RoomList({ onSelectRoom, onCreateRoom, activeRoomId }: RoomListProps) {
  const { listRooms } = useChatAPI();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const data = await listRooms(search || undefined);
      setRooms(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const debounce = setTimeout(loadRooms, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const globalRooms = rooms.filter(r => r.type === 'global');
  const publicRooms = rooms.filter(r => r.type === 'public');
  const privateRooms = rooms.filter(r => r.type === 'private');

  const getRoomIcon = (room: ChatRoom) => {
    if (room.type === 'private') return '🔒';
    if (room.type === 'global') return '🌐';
    return '#';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg hover:border-neon-cyan/30 transition-colors text-sm"
      >
        <span>📋</span>
        <span className="text-gray-300">Rooms</span>
        <span className="text-gray-500 text-xs">({rooms.length})</span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 glass-panel rounded-xl shadow-xl border border-gray-700 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="w-full bg-architect-input border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
            />
          </div>

          {/* Room List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-neon-cyan" />
              </div>
            )}

            {/* Global Rooms */}
            {globalRooms.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Global</p>
                {globalRooms.map(room => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    icon={getRoomIcon(room)}
                    isActive={room.id === activeRoomId}
                    onClick={() => { onSelectRoom(room); setIsOpen(false); }}
                  />
                ))}
              </div>
            )}

            {/* Public Rooms */}
            {publicRooms.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Public</p>
                {publicRooms.map(room => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    icon={getRoomIcon(room)}
                    isActive={room.id === activeRoomId}
                    onClick={() => { onSelectRoom(room); setIsOpen(false); }}
                  />
                ))}
              </div>
            )}

            {/* Private Rooms */}
            {privateRooms.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Private</p>
                {privateRooms.map(room => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    icon={getRoomIcon(room)}
                    isActive={room.id === activeRoomId}
                    onClick={() => { onSelectRoom(room); setIsOpen(false); }}
                  />
                ))}
              </div>
            )}

            {!loading && rooms.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">No rooms found</p>
            )}
          </div>

          {/* Create Room */}
          <div className="p-2 border-t border-gray-800">
            <button
              onClick={() => { onCreateRoom(); setIsOpen(false); }}
              className="w-full py-1.5 text-sm text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
            >
              + Create Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomItem({ room, icon, isActive, onClick }: {
  room: ChatRoom;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
        isActive ? 'bg-neon-cyan/10 border-l-2 border-neon-cyan' : ''
      }`}
    >
      <span className="text-gray-400 text-sm w-5 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isActive ? 'text-neon-cyan' : 'text-gray-300'}`}>{room.name}</p>
        {room.description && (
          <p className="text-gray-600 text-xs truncate">{room.description}</p>
        )}
      </div>
      <span className="text-gray-600 text-xs flex-shrink-0">{room.member_count}👤</span>
    </button>
  );
}
