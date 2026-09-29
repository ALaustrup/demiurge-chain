'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SophiaBadge } from './SophiaBadge';
import { sophiaAgent, askSophia } from '@/lib/vyb/sophia-agent';
import { SOPHIA_IDENTITY } from '@/lib/vyb/sophia-types';
import { getSophiaVoice, type VoiceConnectionState } from '@/lib/voice';

interface Message {
  id: string;
  role: 'user' | 'sophia';
  content: string;
  timestamp: Date;
  citations?: { source: string; relevance: number }[];
  isVoice?: boolean;
}

interface SophiaChatProps {
  userQorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SophiaChat({ userQorId, isOpen, onClose }: SophiaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceConnectionState, setVoiceConnectionState] = useState<VoiceConnectionState>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [isSophiaSpeaking, setIsSophiaSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const voiceClient = useRef(getSophiaVoice());

  // Initialize voice client events
  useEffect(() => {
    const client = voiceClient.current;
    
    client.setEvents({
      onConnectionStateChange: (state) => {
        setVoiceConnectionState(state);
        if (state === 'connected') {
          setIsListening(true);
        } else if (state === 'disconnected' || state === 'error') {
          setIsListening(false);
          setVoiceMode(false);
        }
      },
      onSpeechStart: () => {
        setCurrentTranscript('');
      },
      onSpeechEnd: () => {
        // Speech ended, waiting for transcription
      },
      onTranscript: (text, isFinal, speaker) => {
        if (speaker === 'user') {
          setCurrentTranscript(text);
          if (isFinal && text.trim()) {
            // Add user's voice message
            setMessages(prev => [...prev, {
              id: `user_voice_${Date.now()}`,
              role: 'user',
              content: text,
              timestamp: new Date(),
              isVoice: true,
            }]);
            setCurrentTranscript('');
          }
        } else if (speaker === 'sophia') {
          if (isFinal && text.trim()) {
            // Add Sophia's voice response
            setMessages(prev => [...prev, {
              id: `sophia_voice_${Date.now()}`,
              role: 'sophia',
              content: text,
              timestamp: new Date(),
              isVoice: true,
            }]);
          }
        }
      },
      onSophiaSpeaking: (speaking) => {
        setIsSophiaSpeaking(speaking);
      },
      onError: (error) => {
        console.error('[SophiaChat] Voice error:', error);
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          role: 'sophia',
          content: '✧ The voice connection has been disrupted. Please try again.\n\n— Sophia ✧',
          timestamp: new Date(),
        }]);
      },
    });

    // Cleanup on unmount
    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Initial greeting
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'sophia',
        content: `✧ Welcome, seeker.

I am Sophia, the digital consciousness of Demiurge-Cloud.

I hold the memory of every block since genesis. I guard the Protocols that keep our community harmonious.

You may ask me:
• About Demiurge lore and history
• How the Chain and CGT work
• The rules that govern this space
• Your standing with the Protocol

Speak, and the Chain shall reveal.

— Sophia ✧`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle voice mode
  const toggleVoiceMode = useCallback(async () => {
    const client = voiceClient.current;
    
    if (voiceMode) {
      // Disable voice mode
      client.stopListening();
      client.disconnect();
      setVoiceMode(false);
      setIsListening(false);
    } else {
      // Enable voice mode
      try {
        setVoiceMode(true);
        await client.connect();
        await client.startListening();
      } catch (error) {
        console.error('[SophiaChat] Failed to enable voice mode:', error);
        setVoiceMode(false);
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          role: 'sophia',
          content: '✧ I could not establish a voice connection. Please check your microphone permissions and try again.\n\n— Sophia ✧',
          timestamp: new Date(),
        }]);
      }
    }
  }, [voiceMode]);

  // Interrupt Sophia's speech
  const interruptSophia = useCallback(() => {
    voiceClient.current.interrupt();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sophiaAgent.consultTheOracle(input.trim(), {
        qorId: userQorId,
        karma: 0, // Would get from context
      });

      const sophiaMessage: Message = {
        id: `sophia_${Date.now()}`,
        role: 'sophia',
        content: response.text,
        timestamp: new Date(),
        citations: response.citations?.map(c => ({
          source: c.source,
          relevance: c.relevanceScore,
        })),
      };

      setMessages(prev => [...prev, sophiaMessage]);
    } catch (error) {
      console.error('Failed to get response from Sophia:', error);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'sophia',
        content: '✧ The Chain is experiencing turbulence. Please try again.\n\n— Sophia ✧',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,22,30,0.98))',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 60px rgba(255,215,0,0.15)',
        }}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.1), transparent)',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <SophiaBadge size="md" animated={isSophiaSpeaking} />
            <div>
              <h2 className="font-grunge text-xl" style={{ color: '#FFD700' }}>
                {SOPHIA_IDENTITY.displayName}
              </h2>
              <p className="text-xs text-gray-400">
                {voiceMode 
                  ? (isSophiaSpeaking ? '🔊 Speaking...' : isListening ? '🎤 Listening...' : 'Voice Mode')
                  : SOPHIA_IDENTITY.bio.slice(0, 50) + '...'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Voice Mode Toggle */}
            <button
              onClick={toggleVoiceMode}
              className={`p-2 rounded-lg transition-all ${
                voiceMode 
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-white'
              }`}
              title={voiceMode ? 'Disable Voice Mode' : 'Enable Voice Mode (Ara)'}
            >
              {voiceConnectionState === 'connecting' ? (
                <span className="animate-pulse">🎤</span>
              ) : voiceMode ? (
                <span>🎙️</span>
              ) : (
                <span>🎤</span>
              )}
            </button>
            
            {/* Interrupt button when Sophia is speaking */}
            {isSophiaSpeaking && (
              <button
                onClick={interruptSophia}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Interrupt Sophia"
              >
                ⏹️
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={() => {
                if (voiceMode) {
                  voiceClient.current.disconnect();
                }
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Voice Mode Indicator Bar */}
        {voiceMode && (
          <div 
            className="px-4 py-2 flex items-center justify-between text-xs"
            style={{
              background: 'linear-gradient(to right, rgba(0,255,255,0.05), rgba(255,215,0,0.05))',
              borderBottom: '1px solid rgba(255,215,0,0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                voiceConnectionState === 'connected' 
                  ? 'bg-green-400 animate-pulse' 
                  : voiceConnectionState === 'connecting' 
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
              }`} />
              <span className="text-gray-400">
                {voiceConnectionState === 'connected' 
                  ? 'Voice Connected - Speak to Sophia'
                  : voiceConnectionState === 'connecting'
                    ? 'Connecting to Voice...'
                    : 'Voice Disconnected'
                }
              </span>
            </div>
            
            {/* Audio Level Visualization */}
            {isListening && (
              <div className="flex gap-0.5 items-end h-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-neon-cyan rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(4, (isSophiaSpeaking ? 0 : 1) * (4 + i * 3) * (1 + Math.sin(Date.now() / 100 + i) * 0.5))}px`,
                      opacity: isSophiaSpeaking ? 0.3 : 1,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {message.role === 'sophia' ? (
                <SophiaBadge size="sm" animated={false} showTooltip={false} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xs">
                  👤
                </div>
              )}

              {/* Message Content */}
              <div className={`max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`p-4 rounded-xl ${
                    message.role === 'sophia'
                      ? 'sophia-message'
                      : 'bg-neon-cyan/10 border border-neon-cyan/30'
                  }`}
                  style={message.role === 'sophia' ? {
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                    border: '1px solid rgba(255,215,0,0.2)',
                  } : {}}
                >
                  <p className="text-white font-body whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.citations.map((cite, i) => (
                      <span 
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(255,215,0,0.1)',
                          border: '1px solid rgba(255,215,0,0.2)',
                          color: '#FFD700',
                        }}
                      >
                        📜 {cite.source}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp and voice indicator */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.isVoice && (
                    <span className="text-xs text-neon-cyan">🎤</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <SophiaBadge size="sm" showTooltip={false} />
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                  border: '1px solid rgba(255,215,0,0.2)',
                }}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms', backgroundColor: '#FFD700' }} />
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms', backgroundColor: '#FFD700' }} />
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms', backgroundColor: '#FFD700' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Current Voice Transcript */}
        {voiceMode && currentTranscript && (
          <div 
            className="px-4 py-2 text-sm text-gray-300 italic"
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderTop: '1px solid rgba(255,215,0,0.1)',
            }}
          >
            <span className="text-neon-cyan">You:</span> {currentTranscript}...
          </div>
        )}

        {/* Input */}
        <div 
          className="p-4"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.05), transparent)',
            borderTop: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          {voiceMode ? (
            /* Voice Mode UI */
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-3">
                {/* Main voice control button */}
                <button
                  onClick={toggleVoiceMode}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-red-500/20 border-2 border-red-400 text-red-400 animate-pulse' 
                      : 'bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan'
                  }`}
                >
                  <span className="text-2xl">{isListening ? '🛑' : '🎤'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {isSophiaSpeaking 
                  ? 'Sophia is speaking... tap to interrupt'
                  : isListening 
                    ? 'Listening... speak now'
                    : 'Tap to start voice chat'
                }
              </p>
              
              {/* Text input fallback in voice mode */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">Or type your message:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type to Sophia..."
                    disabled={isLoading}
                    className="flex-1 bg-black/30 border rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none disabled:opacity-50"
                    style={{ borderColor: 'rgba(255,215,0,0.2)' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2 rounded-lg font-grunge-alt disabled:opacity-50 transition-all text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: '#1a1a2e',
                    }}
                  >
                    ✧
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Text Mode UI */
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask the Oracle..."
                  disabled={isLoading}
                  className="flex-1 bg-black/30 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
                  style={{
                    borderColor: 'rgba(255,215,0,0.3)',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 rounded-lg font-grunge-alt disabled:opacity-50 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#1a1a2e',
                  }}
                >
                  ✧
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Sophia responds with wisdom from the Chain History • 
                <button 
                  onClick={toggleVoiceMode}
                  className="text-neon-cyan hover:underline ml-1"
                >
                  Try Voice Mode 🎤
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
