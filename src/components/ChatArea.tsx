import { useState, useRef, useEffect, FormEvent } from 'react'
import { Send, Square, Menu } from 'lucide-react'
import { Message, Conversation } from '../types'
import ChatMessage from './ChatMessage'

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  streamingContent: string
  onSendMessage: (content: string) => void
  onStopGeneration: () => void
  hasApiKey: boolean
  onToggleSidebar: () => void
}

export default function ChatArea({
  conversation,
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
  onStopGeneration,
  hasApiKey,
  onToggleSidebar,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#212121]">
      {/* Header */}
      <header className="flex items-center gap-3 p-3 border-b border-[#2f2f2f]">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-[#2f2f2f] transition-colors hidden md:flex"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-medium truncate pl-12 md:pl-0">
          {conversation?.title || 'Nuevo chat'}
        </h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-full bg-[#10a37f] flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">¿En qué puedo ayudarte?</h2>
            <p className="text-[#8e8e8e] text-center max-w-md">
              {hasApiKey
                ? 'Escribe un mensaje para comenzar una conversación con Groq AI.'
                : 'Primero configura tu API key de Groq en el panel lateral para comenzar.'}
            </p>
          </div>
        ) : (
          <div className="pb-32">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingContent,
                  timestamp: Date.now(),
                }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-[#2f2f2f]">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative"
        >
          <div className="relative bg-[#2f2f2f] rounded-2xl border border-[#444] focus-within:border-[#666]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasApiKey ? 'Envía un mensaje...' : 'Configura tu API key primero'}
              disabled={!hasApiKey || isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-transparent resize-none outline-none text-[#ececec] placeholder-[#8e8e8e] disabled:opacity-50 max-h-[200px]"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors"
              >
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !hasApiKey}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                <Send size={16} />
              </button>
            )}
          </div>
          <p className="text-xs text-[#8e8e8e] text-center mt-2">
            Groq puede cometer errores. Verifica la información importante.
          </p>
        </form>
      </div>
    </div>
  )
}
