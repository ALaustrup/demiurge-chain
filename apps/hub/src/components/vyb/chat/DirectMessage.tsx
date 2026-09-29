'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatAPI } from './useChatAPI';
import type { ChatMessage, DMConversation } from './types';

interface DirectMessageProps {
  peerQorId?: string;
  onBack: () => void;
}

export function DirectMessage({ peerQorId, onBack }: DirectMessageProps) {
  const { qorId, getDMConversations, getDMHistory, sendDM } = useChatAPI();
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activePeer, setActivePeer] = useState<string | null>(peerQorId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activePeer) {
      loadHistory(activePeer);
      const interval = setInterval(() => loadHistory(activePeer), 3000);
      return () => clearInterval(interval);
    }
  }, [activePeer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getDMConversations();
      setConversations(data);
    } catch {}
    setLoading(false);
  };

  const loadHistory = async (peer: string) => {
    try {
      const msgs = await getDMHistory(peer);
      setMessages(msgs.reverse());
    } catch {}
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activePeer || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const msg = await sendDM(activePeer, content);
      setMessages(prev => [...prev, msg as any]);
    } catch {
      setInput(content);
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Conversation list view
  if (!activePeer) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
          <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">←</button>
          <h3 className="text-white font-medium text-sm">Direct Messages</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-neon-cyan" />
            </div>
          )}

          {!loading && conversations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-600 mt-1">Click on a user in a chat room to start a DM</p>
            </div>
          )}

          {conversations.map((conv) => (
            <button
              key={conv.qor_id}
              onClick={() => setActivePeer(conv.qor_id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-gray-800/50"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                {conv.avatar_url ? (
                  <img src={conv.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : '👤'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm truncate">{conv.display_name}</p>
                  <span className="text-gray-600 text-xs flex-shrink-0">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <p className="text-gray-500 text-xs truncate">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-signal-error text-white text-[10px] flex items-center justify-center flex-shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Chat view with specific peer
  const peer = conversations.find(c => c.qor_id === activePeer);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <button onClick={() => setActivePeer(null)} className="text-gray-400 hover:text-white text-sm">←</button>
        <span className="text-white font-medium text-sm">{peer?.display_name || activePeer.split('#')[0]}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {messages.map((msg) => {
          const isOwn = msg.sender_qor_id === qorId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-1.5 rounded-lg text-sm ${
                isOwn 
                  ? 'bg-neon-cyan/10 text-gray-200 border border-neon-cyan/20' 
                  : 'bg-architect-surface text-gray-300 border border-gray-700'
              }`}>
                <p className="break-words">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-neon-cyan/50' : 'text-gray-600'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${peer?.display_name || activePeer.split('#')[0]}...`}
            className="flex-1 bg-architect-input border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
            maxLength={4000}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg text-sm hover:bg-neon-cyan/30 disabled:opacity-30 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
