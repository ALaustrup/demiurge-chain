'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatAPI } from './useChatAPI';
import { MiniProfile } from './MiniProfile';
import type { RoomMember } from './types';

interface MemberSidebarProps {
  roomId: string;
  onDM?: (qorId: string) => void;
}

export function MemberSidebar({ roomId, onDM }: MemberSidebarProps) {
  const { getMembers } = useChatAPI();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [hoverMember, setHoverMember] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadMembers();
    const interval = setInterval(loadMembers, 15000);
    return () => clearInterval(interval);
  }, [roomId]);

  const loadMembers = async () => {
    try {
      const data = await getMembers(roomId);
      setMembers(data);
    } catch {}
  };

  const handleMouseEnter = (qorId: string, e: React.MouseEvent) => {
    hoverTimeout.current = setTimeout(() => {
      setHoverMember(qorId);
      setHoverPosition({ x: e.clientX - 270, y: e.clientY - 50 });
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoverMember(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'admin': return '⚡';
      default: return '';
    }
  };

  return (
    <div className="w-48 border-l border-gray-800 bg-architect-bg/50 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-800">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Members ({members.length})
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {members.map((member) => (
          <div
            key={member.qor_id}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 cursor-pointer transition-colors"
            onMouseEnter={(e) => handleMouseEnter(member.qor_id, e)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onDM?.(member.qor_id)}
          >
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
            <span className="text-gray-300 text-xs truncate flex-1">
              {getRoleBadge(member.role)} {member.display_name || member.qor_id.split('#')[0]}
            </span>
            {member.is_muted && <span className="text-gray-600 text-xs">🔇</span>}
          </div>
        ))}
        
        {members.length === 0 && (
          <p className="text-gray-600 text-xs text-center py-4">No members</p>
        )}
      </div>

      {/* Mini Profile Popup */}
      {hoverMember && hoverPosition && (
        <MiniProfile
          qorId={hoverMember}
          position={hoverPosition}
          onClose={() => setHoverMember(null)}
          onDM={onDM}
        />
      )}
    </div>
  );
}
