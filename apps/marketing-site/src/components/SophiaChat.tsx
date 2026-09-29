'use client'

import { useState, useRef, useEffect } from 'react'
import { useSophia } from '@/contexts/SophiaContext'
import { X, Send, Bot, User, Minimize2 } from 'lucide-react'
import { useChainStatus } from '@/contexts/ChainStatusContext'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export function SophiaChat() {
  const { isOpen, closeChat, toggleChat } = useSophia()
  const { status, blockNumber } = useChainStatus()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Hello! I\'m Sophia, your AI assistant for Demiurge-Cloud. I can help you with documentation, QOR ID authentication, chain status, development setup, troubleshooting, and bug reports. How can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/sophia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          chainStatus: {
            status,
            blockNumber,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Sophia')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check your connection.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green
                   flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50
                   animate-glow-pulse"
      >
        <Bot className="w-8 h-8 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] glass-panel rounded-lg shadow-2xl flex flex-col z-50 border-2 border-neon-cyan/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neon-cyan/20">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-orbitron font-bold text-white">Sophia</h3>
          <span className="text-xs text-gray-400">AI Assistant</span>
        </div>
        <button
          onClick={closeChat}
          className="text-gray-400 hover:text-neon-cyan transition-colors"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-neon-cyan/20 text-white'
                  : message.role === 'system'
                  ? 'bg-neon-purple/20 text-gray-300'
                  : 'bg-blockchain-light text-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role !== 'user' && (
                  <Bot className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {message.role === 'user' && (
                  <User className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-blockchain-light rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neon-cyan/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Sophia anything..."
            className="flex-1 bg-blockchain-light border border-neon-cyan/20 rounded-lg px-4 py-2 text-white
                     placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-neon-cyan text-blockchain-dark rounded-lg hover:bg-neon-cyan/80
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Chain: {status} {blockNumber ? `(Block #${blockNumber.toLocaleString()})` : ''}
        </p>
      </div>
    </div>
  )
}
