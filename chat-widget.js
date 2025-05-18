// chat-widget.js
;(function(){
  //
  // 1) INJECT MARKED.JS FOR MARKDOWN RENDERING
  //
  function loadMarked(cb) {
    if (window.marked) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadMarked(initWidget);

  function initWidget() {
    //
    // 2) MERGE YOUR CONFIG
    //
    const defaultConfig = {
      webhook: { url: '', route: '' },
      branding: {
        logo: '',
        name: '',
        welcomeText: '',
        responseTimeText: ''
      },
      style: {
        primaryColor: '#854fff',
        secondaryColor: '#6b3fd4',
        position: 'right',
        backgroundColor: '#ffffff',
        fontColor: '#333333'
      },
      showWelcomeScreen: true
    };
    const user = window.ChatWidgetConfig || {};
    const cfg = {
      webhook: { ...defaultConfig.webhook, ...user.webhook },
      branding: { ...defaultConfig.branding, ...user.branding },
      style: { ...defaultConfig.style, ...user.style },
      showWelcomeScreen: user.showWelcomeScreen === false ? false : true
    };

    //
    // 3) INJECT GEIST FONT + CORE STYLES (INCLUDING SPINNER + NO FOOTER + BOX-SIZING)
    //
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);

    const css = `
      .n8n-chat-widget, .n8n-chat-widget * {
        box-sizing: border-box;
      }
      .n8n-chat-widget {
        --chat--color-primary: var(--n8n-chat-primary-color, ${cfg.style.primaryColor});
        --chat--color-secondary: var(--n8n-chat-secondary-color, ${cfg.style.secondaryColor});
        --chat--color-background: var(--n8n-chat-background-color, ${cfg.style.backgroundColor});
        --chat--color-font: var(--n8n-chat-font-color, ${cfg.style.fontColor});
        font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      .n8n-chat-widget .chat-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: none;
        width: 380px;
        height: 600px;
        background: var(--chat--color-background);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(133,79,255,0.15);
        border: 1px solid rgba(133,79,255,0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .n8n-chat-widget .chat-container.position-left {
        left: 20px;
        right: auto;
      }
      .n8n-chat-widget .brand-header {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(133,79,255,0.1);
        position: relative;
        flex-shrink: 0;
      }
      .n8n-chat-widget .brand-header img {
        width: 32px;
        height: 32px;
      }
      .n8n-chat-widget .brand-header span {
        font-size: 18px;
        font-weight: 500;
        color: var(--chat--color-font);
      }
      .n8n-chat-widget .close-button {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--chat--color-font);
        cursor: pointer;
        font-size: 20px;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .n8n-chat-widget .close-button:hover {
        opacity: 1;
      }
      .n8n-chat-widget .new-conversation {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        text-align: center;
        width: 100%;
        max-width: 300px;
      }
      .n8n-chat-widget .welcome-text {
        font-size: 24px;
        font-weight: 600;
        color: var(--chat--color-font);
        margin-bottom: 24px;
        line-height: 1.3;
      }
      .n8n-chat-widget .new-chat-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg,var(--chat--color-primary) 0%,var(--chat--color-secondary) 100%);
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        transition: transform 0.3s;
      }
      .n8n-chat-widget .new-chat-btn:hover { transform: scale(1.02); }
      .n8n-chat-widget .response-text {
        font-size: 14px;
        color: var(--chat--color-font);
        opacity: 0.7;
        margin: 0;
      }
      .n8n-chat-widget .chat-interface {
        flex: 1;
        display: none;
        flex-direction: column;
      }
      .n8n-chat-widget .chat-interface.active {
        display: flex;
      }
      .n8n-chat-widget .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: var(--chat--color-background);
        display: flex;
        flex-direction: column;
      }
      .n8n-chat-widget .chat-message {
        padding: 12px 16px;
        margin: 8px 0;
        border-radius: 12px;
        max-width: 80%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.5;
      }
      .n8n-chat-widget .chat-message.user {
        background: linear-gradient(135deg,var(--chat--color-primary) 0%,var(--chat--color-secondary) 100%);
        color: #fff;
        align-self: flex-end;
        box-shadow: 0 4px 12px rgba(133,79,255,0.2);
        border: none;
      }
      .n8n-chat-widget .chat-message.bot {
        background: var(--chat--color-background);
        border: 1px solid rgba(133,79,255,0.2);
        color: var(--chat--color-font);
        align-self: flex-start;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .n8n-chat-widget .chat-messages .loader {
        display: inline-block;
        flex: 0 0 auto;
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
      .n8n-chat-widget .chat-input {
        padding: 16px;
        background: var(--chat--color-background);
        border-top: 1px solid rgba(133,79,255,0.1);
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      .n8n-chat-widget .chat-input textarea {
        flex: 1;
        padding: 12px;
        border: 1px solid rgba(133,79,255,0.2);
        border-radius: 8px;
        font-size: 14px;
        resize: none;
        font-family: inherit;
      }
      .n8n-chat-widget .chat-input textarea::placeholder {
        color: var(--chat--color-font);
        opacity: 0.6;
      }
      .n8n-chat-widget .chat-input button {
        background: linear-gradient(135deg,var(--chat--color-primary) 0%,var(--chat--color-secondary) 100%);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0 20px;
        cursor: pointer;
        font-weight: 500;
        transition: transform 0.2s;
      }
      .n8n-chat-widget .chat-input button:hover { transform: scale(1.05); }
      .n8n-chat-widget .chat-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background: linear-gradient(135deg,var(--chat--color-primary) 0%,var(--chat--color-secondary) 100%);
        color: #fff;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(133,79,255,0.3);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s;
      }
      .n8n-chat-widget .chat-toggle.position-left { left:20px; right:auto; }
      .n8n-chat-widget .chat-toggle:hover { transform: scale(1.05); }
      .n8n-chat-widget .chat-toggle svg { width:24px; height:24px; fill:currentColor; }

      /* hide the built-in "Powered by" footer */
      .n8n-chat-widget .chat-footer { display: none; }

      /* if welcome is disabled, hide that pane entirely */
      ${cfg.showWelcomeScreen===false 
        ? '.n8n-chat-widget .new-conversation { display: none !important; }'
        : ''}
    `;
    const styleTag = document.createElement('style');
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    //
    // 4) BUILD THE WIDGET DOM
    //
    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;
    let sessionId = '';

    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'n8n-chat-widget';
    widgetRoot.style.setProperty('--n8n-chat-primary-color', cfg.style.primaryColor);
    widgetRoot.style.setProperty('--n8n-chat-secondary-color', cfg.style.secondaryColor);
    widgetRoot.style.setProperty('--n8n-chat-background-color', cfg.style.backgroundColor);
    widgetRoot.style.setProperty('--n8n-chat-font-color', cfg.style.fontColor);

    const container = document.createElement('div');
    container.className = `chat-container${cfg.style.position==='left'?' position-left':''}`;
    container.innerHTML = `
      <div class="brand-header">
        <img src="${cfg.branding.logo}" alt="${cfg.branding.name}"/>
        <span>${cfg.branding.name}</span>
        <button class="close-button">×</button>
      </div>
      <div class="new-conversation">
        <h2 class="welcome-text">${cfg.branding.welcomeText}</h2>
        <button class="new-chat-btn">Send us a message</button>
        <p class="response-text">${cfg.branding.responseTimeText}</p>
      </div>
      <div class="chat-interface">
        <div class="brand-header">
          <img src="${cfg.branding.logo}" alt="${cfg.branding.name}"/>
          <span>${cfg.branding.name}</span>
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
    widgetRoot.appendChild(container);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = `chat-toggle${cfg.style.position==='left'?' position-left':''}`;
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12…"/></svg>`;
    widgetRoot.appendChild(toggleBtn);

    document.body.appendChild(widgetRoot);

    //
    // 5) WIRING UP BEHAVIOR
    //
    const newConv = container.querySelector('.new-conversation');
    const chatInt = container.querySelector('.chat-interface');
    const msgs    = container.querySelector('.chat-messages');
    const ta      = container.querySelector('textarea');
    const sendBtn = container.querySelector('button[type="submit"]');
    const newBtn  = container.querySelector('.new-chat-btn');
    const closeBtn = container.querySelectorAll('.close-button');

    function uuid() { return crypto.randomUUID(); }

    function appendUser(txt){
      const d = document.createElement('div');
      d.className = 'chat-message user';
      d.textContent = txt;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
    function appendBot(txt){
      if (!txt?.trim()) return;
      const d = document.createElement('div');
      d.className = 'chat-message bot';
      d.innerHTML = marked.parse(txt);
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    async function startConversation(){
      sessionId = uuid();
      // hide the very first header + welcome pane
      const firstHeader = container.querySelector(':scope > .brand-header');
      if (firstHeader) firstHeader.style.display = 'none';

      newConv.style.display = 'none';
      chatInt.classList.add('active');
      try {
        const res = await fetch(cfg.webhook.url, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify([{
            action:'loadPreviousSession',
            sessionId,
            route: cfg.webhook.route
          }])
        });
        const data = await res.json();
        if (Array.isArray(data) && data[0].output) appendBot(data[0].output);
      } catch(e){ console.error(e); }
    }

    async function sendMessage(){
      const text = ta.value.trim();
      if (!text) return;
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
          body: JSON.stringify({
            action:'sendMessage',
            sessionId,
            route: cfg.webhook.route,
            chatInput: text
          })
        });
        const resp = await res.json();
        loader.remove();
        const out = Array.isArray(resp)? resp[0].output : resp.output;
        appendBot(out);
      } catch(err){
        console.error(err);
        loader.remove();
      }
    }

    // open/close
    toggleBtn.addEventListener('click', ()=>{
      const isOpen = container.classList.toggle('open');
      if (isOpen && !cfg.showWelcomeScreen) {
        startConversation();
      }
    });
    newBtn.addEventListener('click', startConversation);
    sendBtn.addEventListener('click', sendMessage);
    ta.addEventListener('keypress', e => {
      if (e.key==='Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    closeBtn.forEach(b=> b.addEventListener('click', ()=>{
      container.classList.remove('open');
    }));
  }
})();
