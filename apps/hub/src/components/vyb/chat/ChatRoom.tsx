'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatAPI } from './useChatAPI';
import { MemberSidebar } from './MemberSidebar';
import type { ChatMessage } from './types';

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  onDM?: (qorId: string) => void;
  showMembers?: boolean;
}

export function ChatRoom({ roomId, roomName, onDM, showMembers = true }: ChatRoomProps) {
  const { qorId, getMessages, sendMessage } = useChatAPI();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(pollNewMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getMessages(roomId);
      setMessages(msgs.reverse()); // API returns newest first, we want oldest first
    } catch {}
    setLoading(false);
  };

  const pollNewMessages = async () => {
    try {
      const msgs = await getMessages(roomId);
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = msgs.filter(m => !existingIds.has(m.id));
        if (newMsgs.length > 0) {
          return [...prev, ...newMsgs.reverse()];
        }
        return prev;
      });
    } catch {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const msg = await sendMessage(roomId, content, replyTo?.id);
      setMessages(prev => [...prev, msg]);
      setReplyTo(null);
    } catch (error) {
      setInput(content); // Restore on failure
    }
    setSending(false);
  };

  const loadMore = useCallback(async () => {
    if (messages.length === 0) return;
    const oldestMsg = messages[0];
    const older = await getMessages(roomId, oldestMsg.created_at);
    if (older.length > 0) {
      setMessages(prev => [...older.reverse(), ...prev]);
    }
  }, [messages, roomId]);

  const handleScroll = () => {
    if (containerRef.current?.scrollTop === 0) {
      loadMore();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Message List */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
          onScroll={handleScroll}
        >
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-neon-cyan" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.sender_qor_id === qorId;
            const isSystem = msg.type === 'system';
            const showHeader = i === 0 || messages[i - 1]?.sender_qor_id !== msg.sender_qor_id;

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center py-1">
                  <span className="text-gray-500 text-xs italic">{msg.content}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className="group hover:bg-white/[0.02] rounded px-2 py-0.5">
                {showHeader && (
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-sm font-medium ${isOwn ? 'text-neon-cyan' : 'text-white'}`}>
                      {msg.sender_display_name || msg.sender_qor_id.split('#')[0]}
                    </span>
                    <span className="text-gray-600 text-xs">{formatTime(msg.created_at)}</span>
                  </div>
                )}

                {msg.reply_to_id && msg.reply_preview && (
                  <div className="text-xs text-gray-500 border-l-2 border-gray-700 pl-2 ml-1 mb-0.5 truncate">
                    ↩ {msg.reply_preview}
                  </div>
                )}

                <div className="flex items-start gap-1">
                  <p className="text-gray-300 text-sm break-words flex-1">{msg.content}</p>
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 text-xs transition-opacity flex-shrink-0"
                    title="Reply"
                  >
                    ↩
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 py-1 bg-architect-surface/50 border-t border-gray-800 flex items-center gap-2">
            <span className="text-gray-500 text-xs">↩ Replying to</span>
            <span className="text-gray-300 text-xs truncate flex-1">{replyTo.content}</span>
            <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message #${roomName}...`}
              className="flex-1 bg-architect-input border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
              maxLength={4000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg text-sm hover:bg-neon-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Member Sidebar */}
      {showMembers && (
        <MemberSidebar roomId={roomId} onDM={onDM} />
      )}
    </div>
  );
}
