'use client';

import { useState, useEffect, useRef } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import { vybService } from '@/lib/vyb/service';
import type { Conversation, Message } from '@/lib/vyb/types';
import { VoiceRoom } from './VoiceRoom';
import { DonorUsername } from './DonorUsername';

export function Messages() {
  const { conversations, unreadMessageCount, refreshConversations, profile } = useVYB();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice call state
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; roomId: string } | null>(null);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (conversationId: string) => {
    const msgs = await vybService.getMessages(conversationId);
    setMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const msg = await vybService.sendMessage(selectedConversation.id, { text: newMessage.trim() });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTip = async () => {
    if (!tipAmount || !selectedConversation) return;

    const amount = parseFloat(tipAmount);
    if (amount <= 0) return;

    setIsSending(true);
    try {
      const msg = await vybService.sendMessage(selectedConversation.id, {
        tip: { amount, message: `Sent ${amount} CGT tip! 💰` },
      });
      setMessages(prev => [...prev, msg]);
      setShowTipModal(false);
      setTipAmount('');
    } catch (error) {
      console.error('Failed to send tip:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now.getTime() - msgDate.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return msgDate.toLocaleDateString();
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden h-[600px] flex">
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-grunge-alt text-xl text-neon-cyan flex items-center gap-2">
            💬 Messages
            {unreadMessageCount > 0 && (
              <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadMessageCount}
              </span>
            )}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left hover:bg-blockchain-light/50 transition-colors border-b border-gray-800/50 ${
                  selectedConversation?.id === conv.id ? 'bg-blockchain-light' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-lg">
                      {conv.participants[0]?.displayName?.charAt(0) || '?'}
                    </div>
                    {conv.participants[0]?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-blockchain-dark" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <DonorUsername
                        displayName={conv.participants[0]?.displayName || 'Unknown'}
                        donorTier={conv.participants[0]?.donorTier}
                        chatPrivileges={conv.participants[0]?.chatPrivileges}
                        className="text-white truncate"
                      />
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate">
                        {conv.lastMessage?.content.text || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* New Conversation */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full neon-button py-2 rounded-lg text-sm">
            ➕ New Message
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center">
                  {selectedConversation.participants[0]?.displayName?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-grunge-alt text-white">
                    <DonorUsername
                      displayName={selectedConversation.participants[0]?.displayName || 'Unknown'}
                      donorTier={selectedConversation.participants[0]?.donorTier}
                      chatPrivileges={selectedConversation.participants[0]?.chatPrivileges}
                    />
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.participants[0]?.isOnline 
                      ? '🟢 Online' 
                      : `Last seen ${formatDate(selectedConversation.participants[0]?.lastSeen || new Date())}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Voice Call Button */}
                <button 
                  onClick={() => setIsVoiceCallActive(true)}
                  className={`glass-panel p-2 rounded-lg transition-colors ${
                    isVoiceCallActive 
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' 
                      : 'hover:border-neon-cyan/50'
                  }`}
                  title={isVoiceCallActive ? 'Voice call active' : 'Start voice call'}
                  disabled={isVoiceCallActive}
                >
                  🎙️
                </button>
                <button 
                  onClick={() => setShowTipModal(true)}
                  className="glass-panel p-2 rounded-lg hover:border-green-500/50 transition-colors"
                  title="Send CGT tip"
                >
                  💰
                </button>
                <button className="glass-panel p-2 rounded-lg hover:border-neon-cyan/50 transition-colors">
                  ⚙️
                </button>
              </div>
            </div>
            
            {/* Voice Call Panel */}
            {isVoiceCallActive && selectedConversation && profile && (
              <div className="border-b border-gray-800">
                <VoiceRoom
                  roomId={`voice_${selectedConversation.id}`}
                  userId={profile.qorId}
                  onClose={() => setIsVoiceCallActive(false)}
                />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isOwn = msg.sender === 'me' || msg.sender === selectedConversation.participants[0]?.qorId === false;
                const showDate = index === 0 || formatDate(messages[index - 1].timestamp) !== formatDate(msg.timestamp);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatDate(msg.timestamp)}
                      </div>
                    )}
                    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xs flex-shrink-0">
                        {isOwn ? '👤' : selectedConversation.participants[0]?.displayName?.charAt(0) || '?'}
                      </div>
                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Tip Message */}
                        {msg.content.tip && (
                          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-1">
                            <p className="text-green-400 font-grunge">
                              💰 {msg.content.tip.amount} CGT
                            </p>
                            {msg.content.tip.message && (
                              <p className="text-sm text-gray-300 mt-1">{msg.content.tip.message}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Text Message */}
                        {msg.content.text && (
                          <div className={`glass-panel p-3 rounded-lg ${
                            isOwn 
                              ? 'bg-neon-cyan/10 border-neon-cyan/30' 
                              : 'bg-blockchain-light/50'
                          }`}>
                            <p className="text-sm text-white">{msg.content.text}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                          {isOwn && (
                            <span className="text-xs text-gray-500">
                              {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓' : '○'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <button className="glass-panel p-2 rounded-lg hover:border-neon-cyan/50 transition-colors">
                  📎
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/90 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="neon-button px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <p className="text-6xl mb-4">💬</p>
              <p className="text-gray-400">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel liquid-border p-6 rounded-xl w-80">
            <h3 className="font-grunge-alt text-neon-cyan text-xl mb-4">
              💰 Send CGT Tip
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tip{' '}
              <DonorUsername
                displayName={selectedConversation?.participants[0]?.displayName || 'Unknown'}
                donorTier={selectedConversation?.participants[0]?.donorTier}
                chatPrivileges={selectedConversation?.participants[0]?.chatPrivileges}
                className="text-neon-purple"
                showBadge={false}
              />
            </p>
            <input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="Amount in CGT"
              min="0.01"
              step="0.01"
              className="w-full bg-white border border-neon-cyan/30 rounded-lg px-4 py-2 text-gray-900 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTip}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="flex-1 neon-button py-2 rounded-lg disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
