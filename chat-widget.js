// chat-widget.js
;(function() {
  // 1) Load marked.js for Markdown support
  const md = document.createElement('script');
  md.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
  document.head.append(md);

  // 2) Inject CSS overrides (including spinner styles)
  const css = `
    .n8n-chat-widget {
      --chat--color-primary: #e74266;
      --chat--color-secondary: #db4061;
      --chat--color-background: #fafafb;
      --chat--color-font: #333333;
      font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      position: fixed; bottom: 0; right: 0; z-index: 1000;
    }

    .n8n-chat-widget .chat-container {
      position: fixed; bottom: 20px; right: 20px;
      width: 380px; height: 600px;
      background: var(--chat--color-background);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border: 1px solid #e5e5e5;
      display: none; flex-direction: column;
      overflow: hidden; z-index: 1002;
    }
    .n8n-chat-widget .chat-container.open {
      display: flex;
    }

    .n8n-chat-widget .brand-header {
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      height: 48px; padding: 0 16px;
      display: flex; align-items: center; position: relative;
    }
    .n8n-chat-widget .brand-header img {
      height: 32px; width: auto; object-fit: contain;
    }
    .n8n-chat-widget .brand-header span {
      display: none !important;
    }
    .n8n-chat-widget .close-button {
      position: absolute; right:12px; top:50%; transform: translateY(-50%);
      background:none; border:none; color:#fff; font-size:20px;
      cursor:pointer; opacity:0.8; transition:opacity 0.2s;
    }
    .n8n-chat-widget .close-button:hover {
      opacity: 1;
    }

    .n8n-chat-widget .chat-messages {
      flex: 1; overflow-y: auto;
      padding: 8px 16px; display: flex;
      flex-direction: column; gap: 8px;
      background: transparent;
    }

    .n8n-chat-widget .chat-message {
      max-width: 80%; padding: 4px 12px;
      line-height: 1.5; word-wrap: break-word;
    }
    .n8n-chat-widget .chat-message.bot {
      background: #fff; color: var(--chat--color-font);
      border: 1px solid #e5e5e5; border-radius: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      align-self: flex-start;
    }
    .n8n-chat-widget .chat-message.user {
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      color: #fff; border-radius: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      align-self: flex-end;
    }

    /* Spinner */
    .n8n-chat-widget .chat-message.loading {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 8px !important;
      align-self: flex-start;
      display: flex; justify-content: center;
    }
    .n8n-chat-widget .chat-message.loading::after {
      content: "";
      width: 16px; height: 16px;
      border: 3px solid #f3f3f3;
      border-top-color: var(--chat--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .n8n-chat-widget .chat-input {
      padding: 12px 16px; background: #fff;
      border-top: 1px solid #e5e5e5;
      display: flex; gap: 8px; align-items: center;
    }
    .n8n-chat-widget .chat-input textarea {
      flex: 1; height: 40px; padding: 0 12px;
      line-height: 16px; border: 1px solid #e5e5e5;
      border-radius: 20px; background: #fafafb;
      font-size: 14px; color: var(--chat--color-font);
      resize: none; outline: none;
    }
    .n8n-chat-widget .chat-input textarea:placeholder-shown {
      line-height: 40px;
    }
    .n8n-chat-widget .chat-input textarea::placeholder {
      color: #999;
    }
    .n8n-chat-widget .chat-input button {
      flex: 0 0 auto; height: 40px;
      padding: 0 24px; border: none;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      color: #fff; font-size: 14px;
      font-weight: 500; cursor: pointer;
      transition: transform 0.2s;
    }
    .n8n-chat-widget .chat-input button:hover {
      transform: scale(1.05);
    }

    .n8n-chat-widget .chat-footer {
      display: none !important;
    }

    .n8n-chat-widget .chat-toggle {
      position: fixed; bottom: 20px; right: 20px;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-secondary));
      color: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: center;
      z-index: 1001; transition: transform 0.2s;
    }
    .n8n-chat-widget .chat-toggle:hover {
      transform: scale(1.05);
    }
    .n8n-chat-widget .chat-toggle.position-left {
      right: auto; left: 20px;
    }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // 3) Load Geist Sans font
  const fontLink = document.createElement('link');
  fontLink.rel  = 'stylesheet';
  fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
  document.head.appendChild(fontLink);

  // 4) Merge config & guard re-init
  const defaultConfig = {
    webhook:  { url: '', route: '' },
    branding: { logo: '', welcomeText: '' },
    style:    { position: 'right' }
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

  // 5) Build DOM & logic
  let sessionId = '';
  function uuid() { return crypto.randomUUID(); }

  const root = document.createElement('div');
  root.className = 'n8n-chat-widget';
  document.body.appendChild(root);

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

  // Messages
  const messages = document.createElement('div');
  messages.className = 'chat-messages';
  container.appendChild(messages);

  // Input
  const inputArea = document.createElement('div');
  inputArea.className = 'chat-input';
  inputArea.innerHTML = `
    <textarea placeholder="Type your message here…"></textarea>
    <button>Send</button>
  `;
  container.appendChild(inputArea);

  // Toggle
  const toggle = document.createElement('button');
  toggle.className = `chat-toggle${cfg.style.position === 'left' ? ' position-left' : ''}`;
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 1.821…"/>
    </svg>
  `;
  root.appendChild(toggle);

  // Behavior & Markdown
  const ta      = inputArea.querySelector('textarea');
  const sendBtn = inputArea.querySelector('button');
  const closeBtn= header.querySelector('.close-button');

  function renderBubble(txt, bot) {
    const d = document.createElement('div');
    d.className = 'chat-message ' + (bot ? 'bot' : 'user');
    if (window.marked) d.innerHTML = marked.parse(txt);
    else d.textContent = txt;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
    return d;
  }

  async function sendMessage(txt) {
    renderBubble(txt, false);
    ta.value = '';

    const loader = renderBubble('', true);
    loader.classList.add('loading');

    const payload = {
      action: 'sendMessage',
      sessionId,
      route: cfg.webhook.route,
      chatInput: txt
    };
    try {
      const res = await fetch(cfg.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      loader.remove();
      const out = Array.isArray(data) ? data[0].output : data.output;
      renderBubble(out, true);
    } catch (err) {
      loader.remove();
      console.error(err);
    }
  }

  toggle.addEventListener('click', () => {
    const open = container.classList.toggle('open');
    if (open && !sessionId) {
      sessionId = uuid();
      renderBubble(cfg.branding.welcomeText || 'Hi, how can I help you today?', true);
    }
  });
  closeBtn.addEventListener('click', () => container.classList.remove('open'));
  sendBtn.addEventListener('click', () => {
    const text = ta.value.trim();
    if (text) sendMessage(text);
  });
  ta.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = ta.value.trim();
      if (text) sendMessage(text);
    }
  });
})();
