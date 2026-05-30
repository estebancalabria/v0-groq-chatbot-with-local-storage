import { useState, useRef, useEffect } from 'react'
import { Plus, MessageSquare, Trash2, Menu, X, Settings, Eye, EyeOff, Check } from 'lucide-react'
import { Conversation } from './types'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  apiKey: string
  onApiKeyChange: (key: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  apiKey,
  onApiKeyChange,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempApiKey(apiKey)
  }, [apiKey])

  const handleSaveApiKey = () => {
    onApiKeyChange(tempApiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    return date.toLocaleDateString('es-ES')
  }

  const groupedConversations = conversations.reduce((groups, conv) => {
    const date = formatDate(conv.updatedAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(conv)
    return groups
  }, {} as Record<string, Conversation[]>)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 h-full w-[260px] flex flex-col
          bg-[#171717] transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${!isOpen ? 'md:w-0 md:overflow-hidden' : 'md:w-[260px]'}
        `}
      >
        <div className="flex flex-col h-full p-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onNewConversation}
              className="flex-1 flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#212121] transition-colors text-sm"
            >
              <Plus size={18} />
              <span>Nuevo chat</span>
            </button>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-[#212121] transition-colors md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {Object.entries(groupedConversations).map(([date, convs]) => (
              <div key={date}>
                <div className="px-3 py-2 text-xs font-semibold text-[#8e8e8e]">
                  {date}
                </div>
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    className={`
                      group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
                      ${activeConversationId === conv.id ? 'bg-[#212121]' : 'hover:bg-[#212121]/50'}
                    `}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare size={16} className="flex-shrink-0 text-[#8e8e8e]" />
                    <span className="flex-1 truncate text-sm">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conv.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#2f2f2f] transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-[#8e8e8e]">
                No hay conversaciones aún
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border-t border-[#2f2f2f] pt-2 mt-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-[#212121] transition-colors text-sm"
            >
              <Settings size={18} />
              <span>Configuración</span>
            </button>

            {showSettings && (
              <div className="p-3 space-y-3 bg-[#212121] rounded-lg mt-2">
                <div>
                  <label className="block text-xs text-[#8e8e8e] mb-2">
                    API Key de Groq
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showApiKey ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full px-3 py-2 pr-20 bg-[#2f2f2f] rounded-lg text-sm border border-transparent focus:border-[#10a37f] outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1 rounded hover:bg-[#444] transition-colors"
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSaveApiKey}
                  disabled={!tempApiKey || tempApiKey === apiKey}
                  className={`
                    w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${saved 
                      ? 'bg-green-600 text-white' 
                      : tempApiKey && tempApiKey !== apiKey
                        ? 'bg-[#10a37f] hover:bg-[#0d8a6a] text-white'
                        : 'bg-[#2f2f2f] text-[#8e8e8e] cursor-not-allowed'
                    }
                  `}
                >
                  {saved ? (
                    <>
                      <Check size={14} />
                      Guardado
                    </>
                  ) : (
                    'Guardar API Key'
                  )}
                </button>
                <p className="text-xs text-[#8e8e8e]">
                  Obtén tu API key en{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10a37f] hover:underline"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-3 left-3 z-30 p-2 rounded-lg bg-[#171717] hover:bg-[#212121] transition-colors md:hidden"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  )
}
