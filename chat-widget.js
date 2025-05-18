// chat-widget.js
;(function() {
  // ────────────────────────────────────────────────────────────────────────────
  // 1) Inject custom CSS
  // ────────────────────────────────────────────────────────────────────────────
  const css = `
    /* …all your existing rules… */

    /* Input & bubbles, etc. (unchanged) */

    /* Toggle button styling */
    .n8n-chat-widget .chat-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      transition: transform 0.2s;
    }
    .n8n-chat-widget .chat-toggle:hover {
      transform: scale(1.05);
    }
    .n8n-chat-widget .chat-toggle.position-left {
      right: auto;
      left: 20px;
    }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Load Geist Sans font
  // ────────────────────────────────────────────────────────────────────────────
  const fontLink = document.createElement('link');
  fontLink.rel  = 'stylesheet';
  fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
  document.head.appendChild(fontLink);

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Merge config & prevent re-init
  // ────────────────────────────────────────────────────────────────────────────
  const defaultConfig = {
    webhook:   { url: '', route: '' },
    branding:  { logo: '', name: '', welcomeText: '' },
    style:     { position: 'right' }
  };
  const cfg = window.ChatWidgetConfig
    ? {
        webhook:  { ...defaultConfig.webhook,  ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
        style:    { ...defaultConfig.style,    ...window.ChatWidgetConfig.style }
      }
    : defaultConfig;

  if (window.N8NChatWidgetInitialized) return;
  window.N8NChatWidgetInitialized = true;

  // ────────────────────────────────────────────────────────────────────────────
  // 4) Build the DOM
  // ────────────────────────────────────────────────────────────────────────────
  let sessionId = '';
  function uuid() { return crypto.randomUUID(); }

  const root = document.createElement('div');
  root.className = 'n8n-chat-widget';

  const container = document.createElement('div');
  container.className = `chat-container${cfg.style.position === 'left' ? ' position-left' : ''}`;
  root.appendChild(container);

  // Header
  const header = document.createElement('div');
  header.className = 'brand-header';
  header.innerHTML = `
    <img src="${cfg.branding.logo}" alt="">
    <button class="close-button">×</button>
  `;
  container.appendChild(header);

  // Messages pane
  const messages = document.createElement('div');
  messages.className = 'chat-messages';
  container.appendChild(messages);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'chat-input';
  inputArea.innerHTML = `
    <textarea placeholder="Type your message here…"></textarea>
    <button>Send</button>
  `;
  container.appendChild(inputArea);

  // Toggle button
  const toggle = document.createElement('button');
  toggle.className = `chat-toggle${cfg.style.position === 'left' ? ' position-left' : ''}`;
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487
        3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0
        0012 22c5.523 0 10-4.477 10-10S17.523 2 12
        2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962
        7.962 0 014 12c0-4.411 3.589-8 8-8s8
        3.589 8 8-3.589 8-8 8z"/>
    </svg>
  `;
  root.appendChild(toggle);
  document.body.appendChild(root);

  // ────────────────────────────────────────────────────────────────────────────
  // 5) Wire up behavior
  // ────────────────────────────────────────────────────────────────────────────
  const textarea = inputArea.querySelector('textarea');
  const sendBtn  = inputArea.querySelector('button');
  const closeBtn = header.querySelector('.close-button');

  function appendBot(text) {
    if (!text.trim()) return;
    const div = document.createElement('div');
    div.className = 'chat-message bot';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  function appendUser(text) {
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage(text) {
    appendUser(text);
    textarea.value = '';
    const payload = {
      action: 'sendMessage',
      sessionId,
      route: cfg.webhook.route,
      chatInput: text
    };
    try {
      const res = await fetch(cfg.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const out  = Array.isArray(data) ? data[0].output : data.output;
      appendBot(out);
    } catch(err) {
      console.error(err);
    }
  }

  // Events
  toggle.addEventListener('click', () => {
    const isOpen = container.classList.toggle('open');
    if (isOpen && !sessionId) {
      sessionId = uuid();
      appendBot(cfg.branding.welcomeText || 'Hi, how can I help you today?');
    }
  });
  closeBtn.addEventListener('click', () => container.classList.remove('open'));
  sendBtn.addEventListener('click', () => {
    const txt = textarea.value.trim();
    if (txt) sendMessage(txt);
  });
  textarea.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const txt = textarea.value.trim();
      if (txt) sendMessage(txt);
    }
  });
})();
