'use client';

import type { ChatRoom } from './types';

interface RoomTabsProps {
  openRooms: ChatRoom[];
  activeRoomId: string;
  unreadCounts: Record<string, number>;
  onSelectRoom: (roomId: string) => void;
  onCloseRoom: (roomId: string) => void;
}

export function RoomTabs({ openRooms, activeRoomId, unreadCounts, onSelectRoom, onCloseRoom }: RoomTabsProps) {
  if (openRooms.length === 0) return null;

  return (
    <div className="flex items-center border-b border-gray-800 bg-architect-bg/50 overflow-x-auto">
      {openRooms.map((room) => {
        const isActive = room.id === activeRoomId;
        const unread = unreadCounts[room.id] || 0;

        return (
          <div
            key={room.id}
            className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer border-b-2 transition-colors min-w-0 flex-shrink-0 group ${
              isActive
                ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
            onClick={() => onSelectRoom(room.id)}
          >
            <span className="text-xs">
              {room.type === 'private' ? '🔒' : room.type === 'global' ? '🌐' : '#'}
            </span>
            <span className="text-sm truncate max-w-24">{room.name}</span>
            
            {/* Unread Badge */}
            {unread > 0 && !isActive && (
              <span className="w-4 h-4 rounded-full bg-signal-error text-white text-[10px] flex items-center justify-center flex-shrink-0">
                {unread > 9 ? '9+' : unread}
              </span>
            )}

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseRoom(room.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 text-xs transition-opacity ml-1 flex-shrink-0"
              title="Close tab"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
