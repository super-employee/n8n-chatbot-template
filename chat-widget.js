// chat-widget.js
;(function() {
  // 1) Load marked.js for Markdown support
  const md = document.createElement('script');
  md.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
  document.head.append(md);

  // 2) Inject CSS overrides
  const css = `
    .n8n-chat-widget {
      --chat--color-primary: #e74266;
      --chat--color-secondary: #db4061;
      --chat--color-background: #fafafb;
      --chat--color-font: #333333;
      font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 1000;
    }

    /* Container */
    .n8n-chat-widget .chat-container {
      position: fixed;
      bottom: 20px; right: 20px;
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

    /* Header: pink gradient, logo only */
    .n8n-chat-widget .brand-header {
      background: linear-gradient(
        135deg,
        var(--chat--color-primary),
        var(--chat--color-secondary)
      );
      padding: 0 16px;
      height: 56px;
      display: flex;
      align-items: center;
      position: relative;
    }
    .n8n-chat-widget .brand-header img {
      /* fit the full header height */
      max-height: 100%;
      width: auto;
      object-fit: contain;
    }
    .n8n-chat-widget .brand-header span {
      display: none !important;
    }
    .n8n-chat-widget .close-button {
      position: absolute;
      right: 12px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      color: #fff; font-size: 20px;
      cursor: pointer; opacity: 0.8;
      transition: opacity 0.2s;
    }
    .n8n-chat-widget .close-button:hover {
      opacity: 1;
    }

    /* Messages pane: less vertical padding */
    .n8n-chat-widget .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: transparent;
    }

    /* Bubbles: less top/bottom padding */
    .n8n-chat-widget .chat-message {
      max-width: 80%;
      padding: 8px 16px;
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
      background: linear-gradient(
        135deg,
        var(--chat--color-primary),
        var(--chat--color-secondary)
      );
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
      padding: 0 12px;          /* remove vertical padding */
      line-height: 40px;        /* center text vertically */
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
    }
    .n8n-chat-widget .chat-input button {
      flex: 0 0 auto;
      height: 40px;
      padding: 0 24px;
      border: none;
      border-radius: 20px;
      background: linear-gradient(
        135deg,
        var(--chat--color-primary),
        var(--chat--color-secondary)
      );
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .n8n-chat-widget .chat-input button:hover {
      transform: scale(1.05);
    }

    /* Hide powered-by */
    .n8n-chat-widget .chat-footer {
      display: none !important;
    }

    /* Floating action button */
    .n8n-chat-widget .chat-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--chat--color-primary),
        var(--chat--color-secondary)
      );
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
      right: auto; left: 20px;
    }
  `;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.append(s);

  // 3) Load Geist Sans font
  const fontLink = document.createElement('link');
  fontLink.rel  = 'stylesheet';
  fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
  document.head.append(fontLink);

  // 4) Merge config & guard
  const defaultConfig = {
    webhook:  { url:'', route:'' },
    branding: { logo:'', welcomeText:'' },
    style:    { position:'right' }
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

  // 5) Build DOM & logic (unchanged from before)
  let sessionId = '';
  function uuid(){ return crypto.randomUUID(); }

  const root      = document.createElement('div'); root.className = 'n8n-chat-widget';
  const container = document.createElement('div');
  container.className = `chat-container${cfg.style.position==='left'?' position-left':''}`;
  root.append(container);

  // Header
  const header = document.createElement('div'); header.className = 'brand-header';
  header.innerHTML = `
    <img src="${cfg.branding.logo}" alt="">
    <button class="close-button">×</button>
  `;
  container.append(header);

  // Messages
  const messages = document.createElement('div'); messages.className = 'chat-messages';
  container.append(messages);

  // Input
  const inputArea = document.createElement('div'); inputArea.className = 'chat-input';
  inputArea.innerHTML = `
    <textarea placeholder="Type your message here…"></textarea>
    <button>Send</button>
  `;
  container.append(inputArea);

  // FAB
  const toggle = document.createElement('button');
  toggle.className = `chat-toggle${cfg.style.position==='left'?' position-left':''}`;
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 1.821…"/>
    </svg>
  `;
  root.append(toggle);
  document.body.append(root);

  // Behavior
  const ta      = inputArea.querySelector('textarea');
  const sendBtn = inputArea.querySelector('button');
  const closeBtn= header.querySelector('.close-button');

  function renderBubble(txt, bot) {
    const d = document.createElement('div');
    d.className = 'chat-message ' + (bot?'bot':'user');
    if (window.marked) d.innerHTML = marked.parse(txt);
    else              d.textContent = txt;
    messages.append(d);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage(txt) {
    renderBubble(txt, false);
    ta.value = '';
    const p = { action:'sendMessage', sessionId, route:cfg.webhook.route, chatInput:txt };
    try {
      const r = await fetch(cfg.webhook.url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(p)
      });
      const j = await r.json();
      const out = Array.isArray(j)? j[0].output : j.output;
      renderBubble(out, true);
    } catch(e){ console.error(e); }
  }

  toggle.addEventListener('click', ()=> {
    const isOpen = container.classList.toggle('open');
    if (isOpen && !sessionId) {
      sessionId = uuid();
      renderBubble(cfg.branding.welcomeText || 'Hi, how can I help you today?', true);
    }
  });
  closeBtn.addEventListener('click', ()=>container.classList.remove('open'));
  sendBtn.addEventListener('click', ()=> {
    const t = ta.value.trim(); if (t) sendMessage(t);
  });
  ta.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const t = ta.value.trim(); if (t) sendMessage(t);
    }
  });
})();
