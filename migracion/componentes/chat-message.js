const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
  }
  .message-row {
    padding: 1.5rem 0;
  }
  .message-row:hover .actions { opacity: 1; }
  .container {
    max-width: 48rem;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    gap: 1rem;
  }
  .avatar {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .avatar-user { background: #5436DA; }
  .avatar-assistant { background: #10a37f; }
  .avatar svg { width: 18px; height: 18px; fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .content { flex: 1; min-width: 0; }
  .role { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; }
  .text { color: #ececec; white-space: pre-wrap; word-break: break-word; line-height: 1.625; }
  .actions { margin-top: 0.75rem; opacity: 0; transition: opacity 0.2s; }
  .copy-btn {
    display: inline-flex; align-items: center; gap: 4px;
    background: none; border: none; color: #8e8e8e; cursor: pointer;
    font-size: 0.75rem; padding: 0;
  }
  .copy-btn:hover { color: white; }
  .copy-btn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
<div class="message-row">
  <div class="container">
    <div class="avatar" id="avatar">
      <svg id="icon-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <svg id="icon-bot" viewBox="0 0 24 24" style="display:none"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
    </div>
    <div class="content">
      <div class="role" id="role"></div>
      <div class="text" id="text"></div>
      <div class="actions" id="actions" style="display:none">
        <button class="copy-btn" id="copy-btn">
          <svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span id="copy-label">Copiar</span>
        </button>
      </div>
    </div>
  </div>
</div>
`;

class ChatMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ['role', 'content'];
  }

  connectedCallback() {
    this.shadowRoot.getElementById('copy-btn').addEventListener('click', () => this._handleCopy());
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const role = this.getAttribute('role') || 'user';
    const content = this.getAttribute('content') || '';
    const isUser = role === 'user';

    const avatar = this.shadowRoot.getElementById('avatar');
    avatar.className = `avatar ${isUser ? 'avatar-user' : 'avatar-assistant'}`;

    this.shadowRoot.getElementById('icon-user').style.display = isUser ? '' : 'none';
    this.shadowRoot.getElementById('icon-bot').style.display = isUser ? 'none' : '';

    this.shadowRoot.getElementById('role').textContent = isUser ? 'Tú' : 'Groq AI';
    this.shadowRoot.getElementById('text').textContent = content;
    this.shadowRoot.getElementById('actions').style.display = isUser ? 'none' : '';
  }

  async _handleCopy() {
    const content = this.getAttribute('content') || '';
    await navigator.clipboard.writeText(content);
    const label = this.shadowRoot.getElementById('copy-label');
    label.textContent = 'Copiado';
    setTimeout(() => { label.textContent = 'Copiar'; }, 2000);
  }
}

customElements.define('chat-message', ChatMessage);
