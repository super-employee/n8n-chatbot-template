(function() {
  // Create and inject styles
  const styles = `
    .n8n-chat-widget {
      --chat--color-primary: var(--n8n-chat-primary-color, #854fff);
      --chat--color-secondary: var(--n8n-chat-secondary-color, #6b3fd4);
      --chat--color-background: var(--n8n-chat-background-color, #ffffff);
      --chat--color-font: var(--n8n-chat-font-color, #333333);
      font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    .n8n-chat-widget .chat-container { /* …existing styles… */ }
    /* …all your existing CSS rules… */

    /* Loader spinner */
    .n8n-chat-widget .chat-messages .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--chat--color-primary);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 8px 0;
      align-self: flex-start;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Remove the footer area completely */
    .n8n-chat-widget .chat-footer { display: none; }
  `;
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Load Geist font
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
  document.head.appendChild(fontLink);

  // Merge config
  const defaultConfig = {
    webhook: { url: '', route: '' },
    branding: { logo: '', name: '' },
    style: { primaryColor: '', secondaryColor: '', position: 'right', backgroundColor: '#fff', fontColor: '#333' }
  };
  const cfg = window.ChatWidgetConfig
    ? {
        webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
        style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
      }
    : defaultConfig;

  if (window.N8NChatWidgetInitialized) return;
  window.N8NChatWidgetInitialized = true;

  let currentSessionId = '';

  // Build DOM
  const widget = document.createElement('div');
  widget.className = 'n8n-chat-widget';
  widget.style.setProperty('--n8n-chat-primary-color', cfg.style.primaryColor);
  widget.style.setProperty('--n8n-chat-secondary-color', cfg.style.secondaryColor);
  widget.style.setProperty('--n8n-chat-background-color', cfg.style.backgroundColor);
  widget.style.setProperty('--n8n-chat-font-color', cfg.style.fontColor);

  // Chat container
  const chatContainer = document.createElement('div');
  chatContainer.className = `chat-container${cfg.style.position==='left'?' position-left':''}`;
  chatContainer.innerHTML = `
    <div class="brand-header">
      <img src="${cfg.branding.logo}" alt="${cfg.branding.name}" /><span>${cfg.branding.name}</span>
      <button class="close-button">×</button>
    </div>
    <div class="new-conversation">
      <h2 class="welcome-text">${cfg.branding.welcomeText}</h2>
      <button class="new-chat-btn">Send us a message</button>
      <p class="response-text">${cfg.branding.responseTimeText}</p>
    </div>
    <div class="chat-interface">
      <div class="brand-header">
        <img src="${cfg.branding.logo}" alt="${cfg.branding.name}" /><span>${cfg.branding.name}</span>
        <button class="close-button">×</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <textarea placeholder="Type your message here..." rows="1"></textarea>
        <button type="submit">Send</button>
      </div>
      <div class="chat-footer"></div>
    </div>
  `;

  // Toggle button
  const toggle = document.createElement('button');
  toggle.className = `chat-toggle${cfg.style.position==='left'?' position-left':''}`;
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12…"/></svg>
  `;

  widget.appendChild(chatContainer);
  widget.appendChild(toggle);
  document.body.appendChild(widget);

  // Element refs
  const newConv = chatContainer.querySelector('.new-conversation');
  const newBtn  = chatContainer.querySelector('.new-chat-btn');
  const chatInt = chatContainer.querySelector('.chat-interface');
  const msgs    = chatContainer.querySelector('.chat-messages');
  const ta      = chatContainer.querySelector('textarea');
  const sendBtn = chatContainer.querySelector('button[type="submit"]');
  const closeButtons = chatContainer.querySelectorAll('.close-button');

  // Helpers
  function uuid() { return crypto.randomUUID(); }
  function appendBot(text) {
    if (!text?.trim()) return;               // skip empty
    const div = document.createElement('div');
    div.className = 'chat-message bot';
    div.innerHTML = marked.parse(text);      // render Markdown
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function appendUser(text) {
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Start new conversation
  async function start() {
    currentSessionId = uuid();
    // Hide welcome
    newConv.style.display = 'none';
    chatInt.classList.add('active');
    // Fetch any history (optional)
    try {
      const res = await fetch(cfg.webhook.url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify([{ action:'loadPreviousSession', sessionId:currentSessionId, route:cfg.webhook.route }])
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0].output) appendBot(data[0].output);
    } catch(e){ console.error(e); }
  }

  // Send a message
  async function sendMessage(text) {
    appendUser(text);
    ta.value = '';
    // show loader
    const loader = document.createElement('div');
    loader.className = 'loader';
    msgs.appendChild(loader);
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await fetch(cfg.webhook.url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'sendMessage', sessionId:currentSessionId, route:cfg.webhook.route, chatInput:text })
      });
      const data = await res.json();
      // remove loader
      loader.remove();
      // render reply
      const reply = Array.isArray(data) ? data[0].output : data.output;
      appendBot(reply);
    } catch (e) {
      console.error(e);
      loader.remove();
    }
  }

  // Event bindings
  newBtn.addEventListener('click', start);
  sendBtn.addEventListener('click', ()=>{ 
    const txt = ta.value.trim();
    if (txt) sendMessage(txt);
  });
  ta.addEventListener('keypress', e=>{
    if (e.key==='Enter' && !e.shiftKey) {
      e.preventDefault();
      const txt = ta.value.trim();
      if (txt) sendMessage(txt);
    }
  });
  toggle.addEventListener('click', ()=> chatContainer.classList.toggle('open'));
  closeButtons.forEach(b=> b.addEventListener('click', ()=> chatContainer.classList.remove('open')));
})();
