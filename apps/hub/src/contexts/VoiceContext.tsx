'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  getSophiaVoice, 
  createWebRTCClient,
  type SophiaVoiceClient,
  type WebRTCClient,
  type VoiceConnectionState,
  type WebRTCConnectionState,
} from '@/lib/voice';

// ============ Types ============

interface VoiceContextType {
  // Sophia Voice
  sophiaVoiceEnabled: boolean;
  toggleSophiaVoice: () => Promise<void>;
  sophiaConnectionState: VoiceConnectionState;
  isSophiaSpeaking: boolean;
  sophiaTranscript: string;
  
  // User Voice Chat (WebRTC)
  activeVoiceRoom: string | null;
  joinVoiceRoom: (roomId: string) => Promise<void>;
  leaveVoiceRoom: () => Promise<void>;
  voiceParticipants: string[];
  
  // Audio Controls
  isMuted: boolean;
  toggleMute: () => void;
  isRecording: boolean;
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  
  // Permissions
  microphonePermission: PermissionState | 'unknown';
  requestMicrophonePermission: () => Promise<boolean>;
  
  // Errors
  lastError: string | null;
  clearError: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

// ============ Provider ============

interface VoiceProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function VoiceProvider({ children, userId }: VoiceProviderProps) {
  // Sophia Voice State
  const [sophiaVoiceEnabled, setSophiaVoiceEnabled] = useState(false);
  const [sophiaConnectionState, setSophiaConnectionState] = useState<VoiceConnectionState>('disconnected');
  const [isSophiaSpeaking, setIsSophiaSpeaking] = useState(false);
  const [sophiaTranscript, setSophiaTranscript] = useState('');
  
  // WebRTC Voice State
  const [activeVoiceRoom, setActiveVoiceRoom] = useState<string | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<string[]>([]);
  
  // Audio Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Permission State
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState | 'unknown'>('unknown');
  
  // Error State
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Refs for clients
  const sophiaClientRef = useRef<SophiaVoiceClient | null>(null);
  const webrtcClientRef = useRef<WebRTCClient | null>(null);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Initialize Sophia client with event handlers
  useEffect(() => {
    const client = getSophiaVoice({
      onConnectionStateChange: (state) => {
        setSophiaConnectionState(state);
        if (state === 'disconnected' || state === 'error') {
          setSophiaVoiceEnabled(false);
          setIsRecording(false);
        }
      },
      onSophiaSpeaking: (speaking) => {
        setIsSophiaSpeaking(speaking);
      },
      onTranscript: (text, isFinal, speaker) => {
        if (speaker === 'sophia' && isFinal) {
          setSophiaTranscript(text);
        }
      },
      onError: (error) => {
        setLastError(error.message);
      },
    });
    
    sophiaClientRef.current = client;

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  // ============ Permission Handlers ============

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicrophonePermission(result.state);
      
      result.addEventListener('change', () => {
        setMicrophonePermission(result.state);
      });
    } catch {
      // Permissions API not supported
      setMicrophonePermission('unknown');
    }
  };

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      return true;
    } catch (error) {
      setMicrophonePermission('denied');
      setLastError('Microphone permission denied');
      return false;
    }
  }, []);

  // ============ Sophia Voice Handlers ============

  const toggleSophiaVoice = useCallback(async () => {
    const client = sophiaClientRef.current;
    if (!client) return;

    if (sophiaVoiceEnabled) {
      // Disable
      client.stopListening();
      client.disconnect();
      setSophiaVoiceEnabled(false);
      setIsRecording(false);
    } else {
      // Enable
      try {
        // Check permission first
        if (microphonePermission !== 'granted') {
          const granted = await requestMicrophonePermission();
          if (!granted) return;
        }

        await client.connect();
        await client.startListening();
        setSophiaVoiceEnabled(true);
        setIsRecording(true);
      } catch (error: any) {
        setLastError(error.message || 'Failed to enable Sophia voice');
        setSophiaVoiceEnabled(false);
      }
    }
  }, [sophiaVoiceEnabled, microphonePermission, requestMicrophonePermission]);

  // ============ WebRTC Voice Handlers ============

  const joinVoiceRoom = useCallback(async (roomId: string) => {
    if (!userId) {
      setLastError('User ID required for voice chat');
      return;
    }

    // Leave existing room first
    if (webrtcClientRef.current) {
      await webrtcClientRef.current.leave();
    }

    // Check permission
    if (microphonePermission !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      const client = createWebRTCClient(
        { roomId, userId },
        {
          onParticipantJoined: (peerId) => {
            setVoiceParticipants(prev => [...prev, peerId]);
          },
          onParticipantLeft: (peerId) => {
            setVoiceParticipants(prev => prev.filter(p => p !== peerId));
          },
          onError: (error) => {
            setLastError(error.message);
          },
        }
      );

      await client.join();
      webrtcClientRef.current = client;
      setActiveVoiceRoom(roomId);
      setIsRecording(true);
    } catch (error: any) {
      setLastError(error.message || 'Failed to join voice room');
    }
  }, [userId, microphonePermission, requestMicrophonePermission]);

  const leaveVoiceRoom = useCallback(async () => {
    if (webrtcClientRef.current) {
      await webrtcClientRef.current.leave();
      webrtcClientRef.current = null;
    }
    setActiveVoiceRoom(null);
    setVoiceParticipants([]);
    setIsRecording(false);
  }, []);

  // ============ Audio Control Handlers ============

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    // Apply to WebRTC client
    if (webrtcClientRef.current) {
      webrtcClientRef.current.setMuted(newMuted);
    }
  }, [isMuted]);

  const setMicrophoneEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      if (microphonePermission !== 'granted') {
        await requestMicrophonePermission();
      }
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  }, [microphonePermission, requestMicrophonePermission]);

  // ============ Error Handlers ============

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // ============ Context Value ============

  const value: VoiceContextType = {
    // Sophia Voice
    sophiaVoiceEnabled,
    toggleSophiaVoice,
    sophiaConnectionState,
    isSophiaSpeaking,
    sophiaTranscript,
    
    // WebRTC Voice
    activeVoiceRoom,
    joinVoiceRoom,
    leaveVoiceRoom,
    voiceParticipants,
    
    // Audio Controls
    isMuted,
    toggleMute,
    isRecording,
    setMicrophoneEnabled,
    
    // Permissions
    microphonePermission,
    requestMicrophonePermission,
    
    // Errors
    lastError,
    clearError,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

// ============ Hook ============

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

// Optional hook that doesn't throw if used outside provider
export function useVoiceOptional(): VoiceContextType | null {
  return useContext(VoiceContext);
}
