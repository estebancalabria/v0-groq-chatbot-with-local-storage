const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: contents; }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 40;
  }
  @media (min-width: 768px) { .overlay { display: none !important; } }

  aside {
    position: fixed;
    z-index: 50;
    height: 100%;
    width: 260px;
    display: flex;
    flex-direction: column;
    background: #171717;
    transition: transform 0.3s ease-in-out;
    transform: translateX(-100%);
  }
  aside.open { transform: translateX(0); }

  @media (min-width: 768px) {
    aside {
      position: relative;
      transform: translateX(0);
    }
    aside:not(.open) {
      width: 0;
      overflow: hidden;
    }
    aside.open { width: 260px; }
  }

  .inner { display: flex; flex-direction: column; height: 100%; padding: 0.5rem; }

  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
  .new-chat-btn {
    flex: 1;
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: none; border: none; color: #ececec; cursor: pointer;
    font-size: 0.875rem;
  }
  .new-chat-btn:hover { background: #212121; }
  .close-btn {
    padding: 0.5rem; border-radius: 0.5rem;
    background: none; border: none; color: #ececec; cursor: pointer;
    display: block;
  }
  .close-btn:hover { background: #212121; }
  @media (min-width: 768px) { .close-btn { display: none; } }

  .conversations { flex: 1; overflow-y: auto; }
  .date-label { padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 600; color: #8e8e8e; }
  .conv-item {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.75rem; border-radius: 0.5rem; cursor: pointer;
  }
  .conv-item:hover { background: rgba(33,33,33,0.5); }
  .conv-item.active { background: #212121; }
  .conv-item .icon { flex-shrink: 0; color: #8e8e8e; }
  .conv-item .title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; }
  .conv-item .delete-btn {
    opacity: 0; padding: 0.25rem; border-radius: 0.25rem;
    background: none; border: none; color: #ececec; cursor: pointer;
  }
  .conv-item:hover .delete-btn { opacity: 1; }
  .conv-item .delete-btn:hover { background: #2f2f2f; }
  .empty { padding: 2rem 0.75rem; text-align: center; font-size: 0.875rem; color: #8e8e8e; }

  .settings-section { border-top: 1px solid #2f2f2f; padding-top: 0.5rem; margin-top: 0.5rem; }
  .settings-btn {
    display: flex; align-items: center; gap: 0.75rem; width: 100%;
    padding: 0.75rem; border-radius: 0.5rem;
    background: none; border: none; color: #ececec; cursor: pointer; font-size: 0.875rem;
  }
  .settings-btn:hover { background: #212121; }

  .settings-panel {
    display: none;
    padding: 0.75rem;
    background: #212121;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
  }
  .settings-panel.show { display: block; }
  .settings-panel label { display: block; font-size: 0.75rem; color: #8e8e8e; margin-bottom: 0.5rem; }
  .api-input-wrapper { position: relative; }
  .api-input {
    width: 100%; padding: 0.5rem 3rem 0.5rem 0.75rem;
    background: #2f2f2f; border: 1px solid transparent; border-radius: 0.5rem;
    color: #ececec; font-size: 0.875rem; outline: none; box-sizing: border-box;
  }
  .api-input:focus { border-color: #10a37f; }
  .api-input::placeholder { color: #8e8e8e; }
  .toggle-eye {
    position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #8e8e8e; cursor: pointer; padding: 0.25rem;
    border-radius: 0.25rem;
  }
  .toggle-eye:hover { background: #444; }
  .save-btn {
    width: 100%; margin-top: 0.75rem; padding: 0.5rem;
    border-radius: 0.5rem; border: none; font-size: 0.875rem; font-weight: 500;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .save-btn.active { background: #10a37f; color: white; }
  .save-btn.active:hover { background: #0d8a6a; }
  .save-btn.disabled { background: #2f2f2f; color: #8e8e8e; cursor: not-allowed; }
  .save-btn.saved { background: #16a34a; color: white; }
  .hint { font-size: 0.75rem; color: #8e8e8e; margin-top: 0.75rem; }
  .hint a { color: #10a37f; text-decoration: none; }
  .hint a:hover { text-decoration: underline; }

  .mobile-open-btn {
    display: none;
    position: fixed; top: 0.75rem; left: 0.75rem; z-index: 30;
    padding: 0.5rem; border-radius: 0.5rem; background: #171717; border: none;
    color: #ececec; cursor: pointer;
  }
  .mobile-open-btn:hover { background: #212121; }
  @media (max-width: 767px) {
    .mobile-open-btn:not(.hidden) { display: flex; }
  }

  svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .small-icon { width: 14px; height: 14px; }
  .icon-16 { width: 16px; height: 16px; }
  .icon-20 { width: 20px; height: 20px; }
</style>

<div class="overlay" id="overlay"></div>

<aside id="sidebar">
  <div class="inner">
    <div class="header">
      <button class="new-chat-btn" id="new-chat-btn">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Nuevo chat</span>
      </button>
      <button class="close-btn" id="close-btn">
        <svg class="icon-20" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="conversations" id="conversations"></div>

    <div class="settings-section">
      <button class="settings-btn" id="settings-btn">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>Configuración</span>
      </button>
      <div class="settings-panel" id="settings-panel">
        <label>API Key de Groq</label>
        <div class="api-input-wrapper">
          <input class="api-input" id="api-input" type="password" placeholder="gsk_..." />
          <button class="toggle-eye" id="toggle-eye">
            <svg class="small-icon" viewBox="0 0 24 24" id="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <button class="save-btn disabled" id="save-btn">Guardar API Key</button>
        <p class="hint">Obtén tu API key en <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com</a></p>
      </div>
    </div>
  </div>
</aside>

<button class="mobile-open-btn" id="mobile-open-btn">
  <svg class="icon-20" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
</button>
`;

class ChatSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._conversations = [];
    this._activeConversationId = null;
    this._apiKey = '';
    this._tempApiKey = '';
    this._showApiKey = false;
    this._showSettings = false;
    this._isOpen = true;
    this._saved = false;
  }

  connectedCallback() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    $('new-chat-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('new-conversation'));
    });

    $('close-btn').addEventListener('click', () => this._toggle());
    $('overlay').addEventListener('click', () => this._toggle());
    $('mobile-open-btn').addEventListener('click', () => this._toggle());

    $('settings-btn').addEventListener('click', () => {
      this._showSettings = !this._showSettings;
      this._renderSettings();
    });

    $('toggle-eye').addEventListener('click', () => {
      this._showApiKey = !this._showApiKey;
      $('api-input').type = this._showApiKey ? 'text' : 'password';
    });

    $('api-input').addEventListener('input', (e) => {
      this._tempApiKey = e.target.value;
      this._updateSaveButton();
    });

    $('save-btn').addEventListener('click', () => this._handleSave());
  }

  set conversations(val) {
    this._conversations = val;
    this._renderConversations();
  }

  set activeConversationId(val) {
    this._activeConversationId = val;
    this._renderConversations();
  }

  set apiKey(val) {
    this._apiKey = val;
    this._tempApiKey = val;
    const input = this.shadowRoot.getElementById('api-input');
    if (input) input.value = val;
    this._updateSaveButton();
  }

  set isOpen(val) {
    this._isOpen = val;
    this._updateVisibility();
  }

  _toggle() {
    this.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }

  _updateVisibility() {
    const sidebar = this.shadowRoot.getElementById('sidebar');
    const overlay = this.shadowRoot.getElementById('overlay');
    const mobileBtn = this.shadowRoot.getElementById('mobile-open-btn');

    if (this._isOpen) {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
      mobileBtn.classList.add('hidden');
    } else {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
      mobileBtn.classList.remove('hidden');
    }
  }

  _formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  }

  _renderConversations() {
    const container = this.shadowRoot.getElementById('conversations');
    container.innerHTML = '';

    if (this._conversations.length === 0) {
      container.innerHTML = '<div class="empty">No hay conversaciones aún</div>';
      return;
    }

    const groups = {};
    for (const conv of this._conversations) {
      const date = this._formatDate(conv.updatedAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(conv);
    }

    for (const [date, convs] of Object.entries(groups)) {
      const label = document.createElement('div');
      label.className = 'date-label';
      label.textContent = date;
      container.appendChild(label);

      for (const conv of convs) {
        const item = document.createElement('div');
        item.className = `conv-item${this._activeConversationId === conv.id ? ' active' : ''}`;
        item.innerHTML = `
          <svg class="icon icon-16" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="title">${this._escapeHtml(conv.title)}</span>
          <button class="delete-btn"><svg class="small-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        item.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('select-conversation', { detail: conv.id }));
        });
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.dispatchEvent(new CustomEvent('delete-conversation', { detail: conv.id }));
        });
        container.appendChild(item);
      }
    }
  }

  _renderSettings() {
    const panel = this.shadowRoot.getElementById('settings-panel');
    panel.classList.toggle('show', this._showSettings);
  }

  _updateSaveButton() {
    const btn = this.shadowRoot.getElementById('save-btn');
    if (!btn) return;
    const canSave = this._tempApiKey && this._tempApiKey !== this._apiKey;
    btn.className = `save-btn ${this._saved ? 'saved' : canSave ? 'active' : 'disabled'}`;
    btn.textContent = this._saved ? '✓ Guardado' : 'Guardar API Key';
  }

  _handleSave() {
    if (!this._tempApiKey || this._tempApiKey === this._apiKey) return;
    this.dispatchEvent(new CustomEvent('api-key-change', { detail: this._tempApiKey }));
    this._saved = true;
    this._updateSaveButton();
    setTimeout(() => {
      this._saved = false;
      this._updateSaveButton();
    }, 2000);
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('chat-sidebar', ChatSidebar);
