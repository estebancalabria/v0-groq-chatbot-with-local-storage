import './chat-message.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    background: #212121;
    min-width: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid #2f2f2f;
  }
  .toggle-btn {
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: none;
    border: none;
    color: #ececec;
    cursor: pointer;
    display: none;
  }
  .toggle-btn:hover { background: #2f2f2f; }
  @media (min-width: 768px) {
    .toggle-btn { display: flex; }
  }
  .title {
    font-size: 0.875rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 3rem;
  }
  @media (min-width: 768px) {
    .title { padding-left: 0; }
  }
  .messages-container {
    flex: 1;
    overflow-y: auto;
  }
  .welcome {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .welcome-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: #10a37f;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .welcome-icon svg { width: 32px; height: 32px; fill: none; stroke: white; stroke-width: 2; }
  .welcome h2 { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem; color: #ececec; }
  .welcome p { color: #8e8e8e; text-align: center; max-width: 28rem; margin: 0; }
  .messages-list { padding-bottom: 8rem; }
  .input-area {
    padding: 1rem;
    border-top: 1px solid #2f2f2f;
  }
  .input-wrapper {
    max-width: 48rem;
    margin: 0 auto;
    position: relative;
  }
  .input-box {
    position: relative;
    background: #2f2f2f;
    border-radius: 1rem;
    border: 1px solid #444;
  }
  .input-box:focus-within { border-color: #666; }
  textarea {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    background: transparent;
    border: none;
    outline: none;
    color: #ececec;
    resize: none;
    font-family: inherit;
    font-size: inherit;
    max-height: 200px;
  }
  textarea::placeholder { color: #8e8e8e; }
  textarea:disabled { opacity: 0.5; }
  .send-btn, .stop-btn {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .send-btn {
    background: white;
    color: black;
  }
  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .send-btn:hover:not(:disabled) { background: #e5e5e5; }
  .stop-btn {
    background: white;
    color: black;
  }
  .stop-btn:hover { background: #e5e5e5; }
  .send-btn svg, .stop-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .stop-btn svg { fill: currentColor; }
  .disclaimer {
    font-size: 0.75rem;
    color: #8e8e8e;
    text-align: center;
    margin-top: 0.5rem;
  }
  .toggle-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>

<header>
  <button class="toggle-btn" id="toggle-sidebar">
    <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
  <div class="title" id="title">Nuevo chat</div>
</header>

<div class="messages-container" id="messages-container">
  <div class="welcome" id="welcome">
    <div class="welcome-icon">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </div>
    <h2>¿En qué puedo ayudarte?</h2>
    <p id="welcome-text">Escribe un mensaje para comenzar una conversación con Groq AI.</p>
  </div>
  <div class="messages-list" id="messages-list" style="display:none"></div>
</div>

<div class="input-area">
  <div class="input-wrapper">
    <div class="input-box">
      <textarea id="input" rows="1" placeholder="Envía un mensaje..."></textarea>
      <button class="send-btn" id="send-btn">
        <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
      <button class="stop-btn" id="stop-btn" style="display:none">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      </button>
    </div>
    <div class="disclaimer">Groq puede cometer errores. Verifica la información importante.</div>
  </div>
</div>
`;

class ChatArea extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._messages = [];
    this._isLoading = false;
    this._hasApiKey = false;
    this._streamingContent = '';
    this._conversationTitle = '';
  }

  connectedCallback() {
    const input = this.shadowRoot.getElementById('input');
    const sendBtn = this.shadowRoot.getElementById('send-btn');
    const stopBtn = this.shadowRoot.getElementById('stop-btn');
    const toggleBtn = this.shadowRoot.getElementById('toggle-sidebar');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSubmit();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 200) + 'px';
      this._updateSendButton();
    });

    sendBtn.addEventListener('click', () => this._handleSubmit());
    stopBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('stop-generation'));
    });
    toggleBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('toggle-sidebar'));
    });
  }

  set messages(val) {
    this._messages = val;
    this._renderMessages();
  }

  set isLoading(val) {
    this._isLoading = val;
    this._updateButtons();
    this._updateInput();
  }

  set hasApiKey(val) {
    this._hasApiKey = val;
    this._updateInput();
    this._updateWelcomeText();
  }

  set streamingContent(val) {
    this._streamingContent = val;
    this._renderMessages();
  }

  set conversationTitle(val) {
    this._conversationTitle = val;
    this.shadowRoot.getElementById('title').textContent = val || 'Nuevo chat';
  }

  _handleSubmit() {
    const input = this.shadowRoot.getElementById('input');
    const text = input.value.trim();
    if (!text || this._isLoading || !this._hasApiKey) return;
    this.dispatchEvent(new CustomEvent('send-message', { detail: text }));
    input.value = '';
    input.style.height = 'auto';
    this._updateSendButton();
  }

  _updateSendButton() {
    const input = this.shadowRoot.getElementById('input');
    const sendBtn = this.shadowRoot.getElementById('send-btn');
    sendBtn.disabled = !input.value.trim() || !this._hasApiKey;
  }

  _updateButtons() {
    const sendBtn = this.shadowRoot.getElementById('send-btn');
    const stopBtn = this.shadowRoot.getElementById('stop-btn');
    sendBtn.style.display = this._isLoading ? 'none' : 'flex';
    stopBtn.style.display = this._isLoading ? 'flex' : 'none';
  }

  _updateInput() {
    const input = this.shadowRoot.getElementById('input');
    input.disabled = !this._hasApiKey || this._isLoading;
    input.placeholder = this._hasApiKey ? 'Envía un mensaje...' : 'Configura tu API key primero';
  }

  _updateWelcomeText() {
    const el = this.shadowRoot.getElementById('welcome-text');
    el.textContent = this._hasApiKey
      ? 'Escribe un mensaje para comenzar una conversación con Groq AI.'
      : 'Primero configura tu API key de Groq en el panel lateral para comenzar.';
  }

  _renderMessages() {
    const welcome = this.shadowRoot.getElementById('welcome');
    const list = this.shadowRoot.getElementById('messages-list');

    const hasMessages = this._messages.length > 0 || this._streamingContent;

    welcome.style.display = hasMessages ? 'none' : '';
    list.style.display = hasMessages ? '' : 'none';

    if (!hasMessages) return;

    list.innerHTML = '';
    for (const msg of this._messages) {
      const el = document.createElement('chat-message');
      el.setAttribute('role', msg.role);
      el.setAttribute('content', msg.content);
      list.appendChild(el);
    }

    if (this._streamingContent) {
      const el = document.createElement('chat-message');
      el.setAttribute('role', 'assistant');
      el.setAttribute('content', this._streamingContent);
      list.appendChild(el);
    }

    const container = this.shadowRoot.getElementById('messages-container');
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }
}

customElements.define('chat-area', ChatArea);
