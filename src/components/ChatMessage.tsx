import { Message } from '../types'
import { User, Bot, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === 'user'

  return (
    <div className={`group py-6 ${isUser ? '' : ''}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        {/* Avatar */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isUser ? 'bg-[#5436DA]' : 'bg-[#10a37f]'}
          `}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1">
            {isUser ? 'Tú' : 'Groq AI'}
          </div>
          <div className="text-[#ececec] whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>

          {/* Actions */}
          {!isUser && (
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-[#8e8e8e] hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copiar
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
