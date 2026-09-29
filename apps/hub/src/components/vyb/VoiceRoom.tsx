'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createWebRTCClient, type WebRTCClient, type WebRTCConnectionState } from '@/lib/voice';

interface VoiceRoomProps {
  roomId: string;
  userId: string;
  onClose: () => void;
}

interface Participant {
  id: string;
  state: WebRTCConnectionState;
  isSpeaking: boolean;
}

export function VoiceRoom({ roomId, userId, onClose }: VoiceRoomProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<WebRTCClient | null>(null);

  // Initialize WebRTC client
  useEffect(() => {
    const client = createWebRTCClient(
      { roomId, userId },
      {
        onConnectionStateChange: (peerId, state) => {
          setParticipants(prev => {
            const existing = prev.find(p => p.id === peerId);
            if (existing) {
              return prev.map(p => p.id === peerId ? { ...p, state } : p);
            }
            return prev;
          });
        },
        onParticipantJoined: (peerId) => {
          setParticipants(prev => {
            if (prev.find(p => p.id === peerId)) return prev;
            return [...prev, { id: peerId, state: 'connecting', isSpeaking: false }];
          });
        },
        onParticipantLeft: (peerId) => {
          setParticipants(prev => prev.filter(p => p.id !== peerId));
        },
        onError: (err) => {
          setError(err.message);
          console.error('[VoiceRoom] Error:', err);
        },
      }
    );

    clientRef.current = client;

    // Auto-join the room
    joinRoom();

    return () => {
      if (clientRef.current?.isInRoom()) {
        clientRef.current.leave();
      }
    };
  }, [roomId, userId]);

  const joinRoom = async () => {
    if (!clientRef.current || isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      await clientRef.current.join();
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join voice room');
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveRoom = async () => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.leave();
    } catch (err) {
      console.error('[VoiceRoom] Leave error:', err);
    }

    setIsConnected(false);
    setParticipants([]);
    onClose();
  };

  const toggleMute = () => {
    if (!clientRef.current) return;
    const newMuted = clientRef.current.toggleMute();
    setIsMuted(newMuted);
  };

  // Connection status indicator color
  const getStatusColor = (state: WebRTCConnectionState) => {
    switch (state) {
      case 'connected': return 'bg-green-400';
      case 'connecting': return 'bg-yellow-400 animate-pulse';
      case 'disconnected':
      case 'failed':
      case 'closed': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,22,30,0.98))',
        border: '1px solid rgba(0,255,255,0.3)',
        boxShadow: '0 0 30px rgba(0,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(to right, rgba(0,255,255,0.1), transparent)',
          borderBottom: '1px solid rgba(0,255,255,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎙️</span>
          <div>
            <h3 className="font-grunge text-white text-lg">Voice Chat</h3>
            <p className="text-xs text-gray-400">
              {isConnected 
                ? `${participants.length + 1} participant${participants.length !== 0 ? 's' : ''}`
                : isConnecting 
                  ? 'Connecting...'
                  : 'Not connected'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={leaveRoom}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
        >
          Leave
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Participants */}
      <div className="p-4">
        {/* Self */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center">
              👤
            </div>
            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-950 ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
          
          <div className="flex-1">
            <p className="text-white text-sm font-medium">You</p>
            <p className="text-xs text-gray-400">
              {isMuted ? '🔇 Muted' : '🎤 Speaking'}
            </p>
          </div>
          
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg transition-colors ${
              isMuted 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-neon-cyan/20 text-neon-cyan'
            }`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
        </div>

        {/* Other participants */}
        {participants.map((participant) => (
          <div 
            key={participant.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-2"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple/50 to-neon-pink/50 flex items-center justify-center">
                👤
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-950 ${getStatusColor(participant.state)}`} />
            </div>
            
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {participant.id.slice(0, 8)}...
              </p>
              <p className="text-xs text-gray-400">
                {participant.state === 'connected' 
                  ? (participant.isSpeaking ? '🔊 Speaking' : '🔈 Connected')
                  : participant.state
                }
              </p>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {participants.length === 0 && isConnected && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🎧</p>
            <p className="text-sm">Waiting for others to join...</p>
            <p className="text-xs mt-1 text-gray-500">
              Share the conversation link to invite others
            </p>
          </div>
        )}

        {/* Connecting state */}
        {isConnecting && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2 animate-pulse">🔄</p>
            <p className="text-sm">Connecting to voice chat...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div 
        className="px-4 py-3 flex justify-center gap-4"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
            isMuted 
              ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' 
              : 'bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan/50'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        
        <button
          onClick={leaveRoom}
          className="w-14 h-14 rounded-full bg-red-500/30 text-red-400 border-2 border-red-500/50 flex items-center justify-center text-2xl hover:bg-red-500/40 transition-colors"
          title="Leave Voice Chat"
        >
          📴
        </button>
      </div>
    </div>
  );
}

// Mini version for embedding in messages
export function VoiceRoomMini({ roomId, userId, onJoin }: { roomId: string; userId: string; onJoin: () => void }) {
  return (
    <button
      onClick={onJoin}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-colors"
    >
      <span className="text-neon-cyan">🎙️</span>
      <span className="text-white text-sm">Join Voice Chat</span>
    </button>
  );
}
