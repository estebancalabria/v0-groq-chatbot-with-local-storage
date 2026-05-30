import { Conversation, StoredData } from './types'

const STORAGE_KEY = 'groq-chatbot-data'

export const getStoredData = (): StoredData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Error reading from localStorage:', e)
  }
  return {
    conversations: [],
    apiKey: null,
    activeConversationId: null,
  }
}

export const saveStoredData = (data: StoredData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

export const saveApiKey = (apiKey: string): void => {
  const data = getStoredData()
  data.apiKey = apiKey
  saveStoredData(data)
}

export const getApiKey = (): string | null => {
  return getStoredData().apiKey
}

export const saveConversations = (conversations: Conversation[]): void => {
  const data = getStoredData()
  data.conversations = conversations
  saveStoredData(data)
}

export const getConversations = (): Conversation[] => {
  return getStoredData().conversations
}

export const saveActiveConversationId = (id: string | null): void => {
  const data = getStoredData()
  data.activeConversationId = id
  saveStoredData(data)
}

export const getActiveConversationId = (): string | null => {
  return getStoredData().activeConversationId
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
