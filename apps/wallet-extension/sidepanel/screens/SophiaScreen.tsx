// Demiurge Side Panel - Sophia AI Chat
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'demiurge_sophia_conversations';
const MAX_HISTORY = 50;

export function SophiaScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<{ url?: string; title?: string; selectedText?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (stored) => {
      const history = stored[STORAGE_KEY] as ChatMessage[] | undefined;
      if (history && history.length > 0) {
        setMessages(history.slice(-MAX_HISTORY));
      }
    });
  }, []);

  // Get page context from active tab
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setPageContext({
          url: tabs[0].url,
          title: tabs[0].title,
        });
      }
    });

    // Listen for tab changes
    const handleTabActivated = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          setPageContext({
            url: tabs[0].url,
            title: tabs[0].title,
          });
        }
      });
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabActivated);
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabActivated);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist conversation
  const persistMessages = useCallback((msgs: ChatMessage[]) => {
    chrome.storage.local.set({ [STORAGE_KEY]: msgs.slice(-MAX_HISTORY) });
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = updatedMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chrome.runtime.sendMessage({
        type: 'SOPHIA_QUERY',
        payload: {
          message: text,
          conversationHistory: conversationHistory.slice(0, -1), // Exclude the last user msg (sent separately)
          context: {
            currentPage: pageContext?.url,
            pageTitle: pageContext?.title,
            selectedText: pageContext?.selectedText,
          },
        },
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.success
          ? response.data?.text || 'No response from Sophia.'
          : `Error: ${response.error || 'Unknown error'}`,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Failed to reach Sophia. Please check your connection.',
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    chrome.storage.local.remove(STORAGE_KEY);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Page Context Badge */}
      {pageContext?.title && (
        <div className="flex-shrink-0 px-3 py-2 bg-gray-800/50 border-b border-gray-700/30">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="truncate">{pageContext.title}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-demiurge-400/20 to-demiurge-600/20 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🧠</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Sophia AI</h2>
            <p className="text-gray-400 text-sm mb-4">
              Ask me about the Demiurge blockchain, this page, or anything else.
            </p>
            <div className="space-y-2 w-full max-w-[250px]">
              {[
                'What is Demiurge-Cloud?',
                'Summarize this page',
                'How do I stake CGT?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-demiurge-500/50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-demiurge-500/80 text-white rounded-br-md'
                  : 'bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/30'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">✧</span>
                  <span className="text-xs text-demiurge-400 font-medium">Sophia</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-[10px] text-gray-500 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start message-enter">
            <div className="bg-gray-800/80 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-700/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">✧</span>
                <span className="text-xs text-demiurge-400 font-medium">Sophia</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-demiurge-400 rounded-full thinking-dot" />
                <div className="w-2 h-2 bg-demiurge-400 rounded-full thinking-dot" />
                <div className="w-2 h-2 bg-demiurge-400 rounded-full thinking-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-700/50 px-3 py-3">
        <div className="flex items-end gap-2">
          <button
            onClick={clearConversation}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-300 transition-colors"
            title="Clear conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sophia anything..."
            rows={1}
            className="flex-1 bg-gray-800/80 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-demiurge-500/50 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-2.5 bg-demiurge-500 hover:bg-demiurge-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
