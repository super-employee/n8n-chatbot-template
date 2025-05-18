// chat-widget.js
;(function() {
  // ────────────────────────────────────────────────────────────────────────────
  // 1) Inject custom CSS
  // ────────────────────────────────────────────────────────────────────────────
  const css = `
    /* Root font & variables */
    .n8n-chat-widget {
      --chat--color-primary: #e74266;
      --chat--color-secondary: #db4061;
      --chat--color-background: #fafafb;
      --chat--color-font: #333333;
      font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }

    /* Container */
    .n8n-chat-widget .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      height: 600px;
      background: var(--chat--color-background);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border: 1px solid #e5e5e5;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 1000;
    }
    .n8n-chat-widget .chat-container.open {
      display: flex;
    }

    /* Header (logo only) */
    .n8n-chat-widget .brand-header {
      background: #fff;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      position: relative;
      border-bottom: 1px solid #e5e5e5;
    }
    .n8n-chat-widget .brand-header img {
      width: 24px;
      height: 24px;
    }
    .n8n-chat-widget .brand-header span {
      display: none; /* hide text */
    }
    .n8n-chat-widget .close-button {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .n8n-chat-widget .close-button:hover {
      opacity: 1;
    }

    /* Messages pane */
    .n8n-chat-widget .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: transparent;
    }
    .n8n-chat-widget .chat-message {
      max-width: 80%;
      padding: 12px 16px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .n8n-chat-widget .chat-message.bot {
      background: #fff;
      color: var(--chat--color-font);
      border: 1px solid #e5e5e5;
      border-radius: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      align-self: flex-start;
    }
    .n8n-chat-widget .chat-message.user {
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      color: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      align-self: flex-end;
    }

    /* Input area */
    .n8n-chat-widget .chat-input {
      padding: 12px 16px;
      background: #fff;
      border-top: 1px solid #e5e5e5;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .n8n-chat-widget .chat-input textarea {
      flex: 1;
      height: 40px;
      padding: 0 12px;
      border: 1px solid #e5e5e5;
      border-radius: 20px;
      background: #fafafb;
      font-size: 14px;
      color: var(--chat--color-font);
      resize: none;
      outline: none;
    }
    .n8n-chat-widget .chat-input textarea::placeholder {
      color: #999;
      opacity: 1;
    }
    .n8n-chat-widget .chat-input button {
      flex: 0 0 auto;
      height: 40px;
      padding: 0 24px;
      border: none;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .n8n-chat-widget .chat-input button:hover {
      transform: scale(1.05);
    }

    /* Hide “Powered by n8n” */
    .n8n-chat-widget .chat-footer {
      display: none !important;
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
    branding:  { logo: '', name: '', welcomeText: '', responseTimeText: '' },
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

  // Root widget
  const root = document.createElement('div');
  root.className = 'n8n-chat-widget';

  // Chat container
  const container = document.createElement('div');
  container.className = `chat-container${cfg.style.position === 'left' ? ' position-left' : ''}`;
  root.appendChild(container);

  // Header
  const header = document.createElement('div');
  header.className = 'brand-header';
  header.innerHTML = `
    <img src="${cfg.branding.logo}" alt="">
    <span>${cfg.branding.name}</span>
    <button class="close-button">×</button>
  `;
  container.appendChild(header);

  // Messages area
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
  toggle.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821…"/></svg>`;
  root.appendChild(toggle);

  document.body.appendChild(root);

  // ────────────────────────────────────────────────────────────────────────────
  // 5) Chat logic
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
    // call your webhook
    const payload = { action:'sendMessage', sessionId, route:cfg.webhook.route, chatInput:text };
    try {
      const res = await fetch(cfg.webhook.url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const out  = Array.isArray(data)? data[0].output : data.output;
      appendBot(out);
    } catch(err){
      console.error(err);
    }
  }

  // Events
  toggle.addEventListener('click', () => {
    const open = container.classList.toggle('open');
    if (open && !sessionId) {
      // start session
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
