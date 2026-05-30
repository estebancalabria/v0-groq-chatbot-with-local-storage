import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { Conversation, Message } from './types'
import {
  getConversations,
  saveConversations,
  getApiKey,
  saveApiKey,
  getActiveConversationId,
  saveActiveConversationId,
  generateId,
} from './storage'
import { sendMessageToGroq, GroqMessage } from './api'

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const storedConversations = getConversations()
    const storedApiKey = getApiKey()
    const storedActiveId = getActiveConversationId()

    setConversations(storedConversations)
    setApiKey(storedApiKey || '')
    setActiveConversationId(storedActiveId)
  }, [])

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations)
    }
  }, [conversations])

  // Save active conversation ID when it changes
  useEffect(() => {
    saveActiveConversationId(activeConversationId)
  }, [activeConversationId])

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null

  const handleApiKeyChange = (key: string) => {
    setApiKey(key)
    saveApiKey(key)
  }

  const handleNewConversation = () => {
    setActiveConversationId(null)
    setStreamingContent('')
    setSidebarOpen(false)
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setStreamingContent('')
    setSidebarOpen(false)
  }

  const handleDeleteConversation = (id: string) => {
    const newConversations = conversations.filter((c) => c.id !== id)
    setConversations(newConversations)
    saveConversations(newConversations)

    if (activeConversationId === id) {
      setActiveConversationId(newConversations[0]?.id || null)
    }
  }

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!apiKey) return

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }

      let currentConversation: Conversation
      let updatedConversations: Conversation[]

      if (activeConversationId) {
        // Add to existing conversation
        updatedConversations = conversations.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                messages: [...c.messages, userMessage],
                updatedAt: Date.now(),
              }
            : c
        )
        currentConversation = updatedConversations.find((c) => c.id === activeConversationId)!
      } else {
        // Create new conversation
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content
        currentConversation = {
          id: generateId(),
          title,
          messages: [userMessage],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        updatedConversations = [currentConversation, ...conversations]
        setActiveConversationId(currentConversation.id)
      }

      setConversations(updatedConversations)
      setIsLoading(true)
      setStreamingContent('')

      try {
        const messagesToSend: GroqMessage[] = currentConversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        let fullResponse = ''
        await sendMessageToGroq(apiKey, messagesToSend, (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        })

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: fullResponse,
          timestamp: Date.now(),
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversation.id
              ? {
                  ...c,
                  messages: [...c.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        )
      } catch (error) {
        console.error('Error sending message:', error)
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'No se pudo conectar con Groq'}`,
          timestamp: Date.now(),
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversation.id
              ? {
                  ...c,
                  messages: [...c.messages, errorMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        )
      } finally {
        setIsLoading(false)
        setStreamingContent('')
      }
    },
    [apiKey, activeConversationId, conversations]
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatArea
        conversation={activeConversation}
        messages={activeConversation?.messages || []}
        isLoading={isLoading}
        streamingContent={streamingContent}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        hasApiKey={!!apiKey}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  )
}
