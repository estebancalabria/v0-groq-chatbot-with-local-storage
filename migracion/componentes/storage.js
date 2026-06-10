const STORAGE_KEY = 'groq-chatbot-data';

export function getStoredData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading from localStorage:', e);
  }
  return {
    conversations: [],
    apiKey: null,
    activeConversationId: null,
  };
}

export function saveStoredData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

export function saveApiKey(apiKey) {
  const data = getStoredData();
  data.apiKey = apiKey;
  saveStoredData(data);
}

export function getApiKey() {
  return getStoredData().apiKey;
}

export function saveConversations(conversations) {
  const data = getStoredData();
  data.conversations = conversations;
  saveStoredData(data);
}

export function getConversations() {
  return getStoredData().conversations;
}

export function saveActiveConversationId(id) {
  const data = getStoredData();
  data.activeConversationId = id;
  saveStoredData(data);
}

export function getActiveConversationId() {
  return getStoredData().activeConversationId;
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
