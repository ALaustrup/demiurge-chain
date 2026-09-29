'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { SOPHIA_GREETING } from '@/lib/sophia/prompts';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: number;
  isStreaming?: boolean;
}

interface SophiaChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Quick-action suggestions grouped by category
const QUICK_ACTIONS = [
  { label: 'Get Started', prompt: 'I\'m new here. Help me get started.', icon: '🚀' },
  { label: 'Troubleshoot', prompt: 'I have an issue and need help troubleshooting.', icon: '🔧' },
  { label: 'Gnostic Lore', prompt: 'Tell me about the Gnostic philosophy behind Demiurge.', icon: '📜' },
  { label: 'Mint NFT', prompt: 'I want to mint a DRC-369 NFT.', icon: '🎨' },
  { label: 'Stake CGT', prompt: 'How do I stake CGT and earn rewards?', icon: '⚡' },
  { label: 'Governance', prompt: 'Show me the current governance proposals.', icon: '🏛️' },
  { label: 'Deploy Agent', prompt: 'Help me deploy an AI agent on Demiurge.', icon: '🤖' },
  { label: 'Network Health', prompt: 'How is the network doing right now?', icon: '📊' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function SophiaChatPanel({ isOpen, onClose }: SophiaChatPanelProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: SOPHIA_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check voice support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech =
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window;
      setVoiceSupported(hasSpeech);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build page context from current route
  const getPageContext = useCallback(() => {
    if (!pathname) return undefined;

    const context: { route: string; pageTitle?: string; data?: Record<string, any> } = {
      route: pathname,
    };

    // Extract meaningful context from the route
    if (pathname.startsWith('/explorer/block/')) {
      const blockNum = pathname.split('/').pop();
      context.pageTitle = `Block #${blockNum}`;
      context.data = { blockNumber: blockNum };
    } else if (pathname.startsWith('/explorer/tx/')) {
      const txHash = pathname.split('/').pop();
      context.pageTitle = `Transaction ${txHash}`;
      context.data = { txHash };
    } else if (pathname.startsWith('/explorer/account/')) {
      const address = pathname.split('/').pop();
      context.pageTitle = `Account ${address}`;
      context.data = { address };
    } else if (pathname === '/sophia') {
      context.pageTitle = 'Sophia AI Assistant';
    } else if (pathname === '/explorer') {
      context.pageTitle = 'Block Explorer';
    } else if (pathname.startsWith('/validators')) {
      context.pageTitle = 'Validators';
    } else if (pathname.startsWith('/nfts') || pathname.startsWith('/marketplace')) {
      context.pageTitle = 'NFT Marketplace';
    } else if (pathname.startsWith('/docs')) {
      context.pageTitle = 'Documentation';
    } else if (pathname.startsWith('/staking')) {
      context.pageTitle = 'Staking';
    }

    return context;
  }, [pathname]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAMING SEND
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    // Create a placeholder for the streaming response
    const assistantId = `assistant_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    // Build message history
    const apiMessages = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: 'user', content: text });

    // Abort controller for cancellation
    abortControllerRef.current = new AbortController();
    let toolsUsed = 0;
    let fullText = '';

    try {
      const response = await fetch('/api/sophia/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          pageContext: getPageContext(),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed.startsWith('event: ')) {
            // Read the event type for the next data line
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);

              // Check what type of event this is based on the data content
              if (typeof data === 'string') {
                // Token event — append text
                fullText += data;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullText }
                      : m
                  )
                );
              } else if (data.name && data.result) {
                // Tool call event
                toolsUsed++;
              } else if (data.status === 'complete') {
                // Done event
                if (data.toolsUsed) toolsUsed = data.toolsUsed;
              } else if (data.message) {
                // Error event
                throw new Error(data.message);
              }
            } catch (parseErr) {
              // If it's a raw string token, just append
              if (typeof dataStr === 'string' && !dataStr.startsWith('{')) {
                fullText += dataStr;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullText }
                      : m
                  )
                );
              }
            }
          }
        }
      }

      // Finalize the message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: fullText || '✧ I apologize, seeker. Something went wrong. Please try again.',
                isStreaming: false,
                toolsUsed: toolsUsed > 0 ? toolsUsed : undefined,
              }
            : m
        )
      );
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Sophia streaming error:', error);

      // Fallback to non-streaming endpoint
      try {
        const fallbackResponse = await fetch('/api/sophia/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            enableTools: true,
            pageContext: getPageContext(),
          }),
        });
        const fallbackData = await fallbackResponse.json();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fallbackData.text || '✧ The Chain is experiencing turbulence. Please try again.\n\n— Sophia ✧',
                  isStreaming: false,
                  toolsUsed: fallbackData.toolsUsed,
                }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: '✧ The Chain is experiencing turbulence. Please try again.\n\n— Sophia ✧',
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, getPageContext]);

  // ─────────────────────────────────────────────────────────────────────────────
  // VOICE MODE (Web Speech API fallback)
  // ─────────────────────────────────────────────────────────────────────────────

  const toggleVoice = useCallback(async () => {
    if (voiceActive) {
      setVoiceActive(false);
      return;
    }

    if (!voiceSupported) return;

    try {
      const SpeechRecognitionClass = (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      );
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setVoiceActive(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceActive(false);
        if (transcript.trim()) {
          handleSend(transcript.trim());
        }
      };

      recognition.onerror = () => {
        setVoiceActive(false);
      };

      recognition.onend = () => {
        setVoiceActive(false);
      };

      recognition.start();
    } catch {
      setVoiceActive(false);
    }
  }, [voiceActive, voiceSupported, handleSend]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action click
  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-0 right-0 z-50 w-full sm:w-[440px] h-[650px] sm:h-[600px] sm:bottom-6 sm:right-6"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      <div
        className="w-full h-full rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,46,0.98), rgba(22,22,30,0.99))',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 60px rgba(255,215,0,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="p-4 flex items-center justify-between shrink-0"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.1), transparent)',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
            >
              <span className="text-xl">✧</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">Sophia</h2>
              <p className="text-xs text-gray-400">
                {isLoading ? 'Consulting the Chain...' : 'The Oracle of Demiurge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Voice toggle */}
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-lg transition-colors ${
                  voiceActive
                    ? 'bg-[#FFD700]/20 text-[#FFD700]'
                    : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
                title={voiceActive ? 'Stop listening' : 'Voice mode'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {voiceActive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>
            )}
            {/* Minimize */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {message.role === 'assistant' ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                >
                  <span className={`text-sm ${message.isStreaming ? 'animate-pulse' : ''}`}>✧</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/50 to-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 text-xs">
                  👤
                </div>
              )}

              {/* Message */}
              <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`p-3 rounded-xl text-sm ${
                    message.role === 'user'
                      ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                      : ''
                  }`}
                  style={
                    message.role === 'assistant'
                      ? {
                          background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                          border: '1px solid rgba(255,215,0,0.2)',
                        }
                      : {}
                  }
                >
                  <div className="text-white whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
                    {renderMarkdown(message.content)}
                  </div>
                  {message.isStreaming && !message.content && (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FFD700', animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FFD700', animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FFD700', animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.toolsUsed && message.toolsUsed > 0 && (
                    <span className="text-xs text-[#FFD700]/60">
                      🔧 {message.toolsUsed} tool{message.toolsUsed > 1 ? 's' : ''}
                    </span>
                  )}
                  {message.isStreaming && message.content && (
                    <span className="text-xs text-[#FFD700]/40 animate-pulse">streaming...</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Voice listening indicator */}
          {voiceActive && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">Listening...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Actions ── */}
        {showQuickActions && messages.length <= 1 && (
          <div className="px-4 pb-2 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: 'rgba(255,215,0,0.06)',
                    border: '1px solid rgba(255,215,0,0.15)',
                  }}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div
          className="p-4 shrink-0"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.05), transparent)',
            borderTop: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={voiceActive ? 'Listening...' : 'Ask Sophia anything...'}
              disabled={isLoading || voiceActive}
              className="flex-1 bg-black/30 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFD700]/50 disabled:opacity-50"
              style={{ border: '1px solid rgba(255,215,0,0.2)' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#1a1a2e',
              }}
            >
              ✧
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Sophia can search docs, query the chain, mint NFTs, troubleshoot, and more
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN RENDERER (lightweight)
// ═══════════════════════════════════════════════════════════════════════════════

function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  return text.split('\n').map((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h4 key={i} className="text-sm font-bold text-[#FFD700] mt-3 mb-1">{processInline(line.slice(4))}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-base font-bold text-[#FFD700] mt-3 mb-1">{processInline(line.slice(3))}</h3>;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <p key={i} className="pl-3 my-0.5 before:content-['•'] before:mr-2 before:text-[#FFD700]/60">{processInline(line.slice(2))}</p>;
    }
    if (line.match(/^[•●]\s/)) {
      return <p key={i} className="pl-3 my-0.5">{processInline(line)}</p>;
    }

    // Status lines (from troubleshooting)
    if (line.startsWith('✅') || line.startsWith('❌') || line.startsWith('⚠️') || line.startsWith('⏭️')) {
      return <p key={i} className="my-1">{processInline(line)}</p>;
    }

    // Empty lines
    if (!line.trim()) {
      return <br key={i} />;
    }

    // Regular paragraph
    return <p key={i} className="my-1">{processInline(line)}</p>;
  });
}

function processInline(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return <code key={`${i}-${j}`} className="px-1 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700] text-xs font-mono">{cp.slice(1, -1)}</code>;
      }
      return <span key={`${i}-${j}`}>{cp}</span>;
    });
  });
}
