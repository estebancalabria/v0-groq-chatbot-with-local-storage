import { getConversations, saveConversations, getApiKey, saveApiKey, getActiveConversationId, saveActiveConversationId, generateId } from './storage.js';
import { sendMessageToGroq } from './api.js';
import './chat-sidebar.js';
import './chat-area.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #ececec;
    background: #212121;
  }
</style>
<chat-sidebar></chat-sidebar>
<chat-area></chat-area>
`;

class ChatApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._conversations = [];
    this._activeConversationId = null;
    this._apiKey = '';
    this._isLoading = false;
    this._streamingContent = '';
    this._sidebarOpen = true;
  }

  connectedCallback() {
    this._sidebar = this.shadowRoot.querySelector('chat-sidebar');
    this._chatArea = this.shadowRoot.querySelector('chat-area');

    // Load data from localStorage
    this._conversations = getConversations();
    this._apiKey = getApiKey() || '';
    this._activeConversationId = getActiveConversationId();

    // Sidebar events
    this._sidebar.addEventListener('new-conversation', () => {
      this._activeConversationId = null;
      this._streamingContent = '';
      this._sidebarOpen = false;
      saveActiveConversationId(null);
      this._sync();
    });

    this._sidebar.addEventListener('select-conversation', (e) => {
      this._activeConversationId = e.detail;
      this._streamingContent = '';
      this._sidebarOpen = false;
      saveActiveConversationId(e.detail);
      this._sync();
    });

    this._sidebar.addEventListener('delete-conversation', (e) => {
      this._conversations = this._conversations.filter(c => c.id !== e.detail);
      saveConversations(this._conversations);
      if (this._activeConversationId === e.detail) {
        this._activeConversationId = this._conversations[0]?.id || null;
        saveActiveConversationId(this._activeConversationId);
      }
      this._sync();
    });

    this._sidebar.addEventListener('api-key-change', (e) => {
      this._apiKey = e.detail;
      saveApiKey(e.detail);
      this._sync();
    });

    this._sidebar.addEventListener('toggle-sidebar', () => {
      this._sidebarOpen = !this._sidebarOpen;
      this._sync();
    });

    // Chat area events
    this._chatArea.addEventListener('send-message', (e) => {
      this._handleSendMessage(e.detail);
    });

    this._chatArea.addEventListener('stop-generation', () => {
      if (this._abortController) {
        this._abortController.abort();
        this._isLoading = false;
        this._sync();
      }
    });

    this._chatArea.addEventListener('toggle-sidebar', () => {
      this._sidebarOpen = !this._sidebarOpen;
      this._sync();
    });

    this._sync();
  }

  _getActiveConversation() {
    return this._conversations.find(c => c.id === this._activeConversationId) || null;
  }

  async _handleSendMessage(content) {
    if (!this._apiKey) return;

    const userMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    let currentConversation;

    if (this._activeConversationId) {
      this._conversations = this._conversations.map(c =>
        c.id === this._activeConversationId
          ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() }
          : c
      );
      currentConversation = this._conversations.find(c => c.id === this._activeConversationId);
    } else {
      const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
      currentConversation = {
        id: generateId(),
        title,
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this._conversations = [currentConversation, ...this._conversations];
      this._activeConversationId = currentConversation.id;
      saveActiveConversationId(currentConversation.id);
    }

    saveConversations(this._conversations);
    this._isLoading = true;
    this._streamingContent = '';
    this._sync();

    try {
      const messagesToSend = currentConversation.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      let fullResponse = '';
      await sendMessageToGroq(this._apiKey, messagesToSend, (chunk) => {
        fullResponse += chunk;
        this._streamingContent = fullResponse;
        this._chatArea.streamingContent = fullResponse;
      });

      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
      };

      this._conversations = this._conversations.map(c =>
        c.id === currentConversation.id
          ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
          : c
      );
      saveConversations(this._conversations);
    } catch (error) {
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'No se pudo conectar con Groq'}`,
        timestamp: Date.now(),
      };

      this._conversations = this._conversations.map(c =>
        c.id === currentConversation.id
          ? { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() }
          : c
      );
      saveConversations(this._conversations);
    } finally {
      this._isLoading = false;
      this._streamingContent = '';
      this._sync();
    }
  }

  _sync() {
    const activeConv = this._getActiveConversation();

    this._sidebar.conversations = this._conversations;
    this._sidebar.activeConversationId = this._activeConversationId;
    this._sidebar.apiKey = this._apiKey;
    this._sidebar.isOpen = this._sidebarOpen;

    this._chatArea.messages = activeConv?.messages || [];
    this._chatArea.isLoading = this._isLoading;
    this._chatArea.streamingContent = this._streamingContent;
    this._chatArea.hasApiKey = !!this._apiKey;
    this._chatArea.conversationTitle = activeConv?.title || '';
  }
}

customElements.define('chat-app', ChatApp);
