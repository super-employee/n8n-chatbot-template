// chat-widget.js
// Self-contained embed: loads CSS, the @n8n/chat bundle, and initializes with your settings.

(async () => {
  // 1) Load the widget's CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
  document.head.appendChild(cssLink);                                               // :contentReference[oaicite:6]{index=6}

  // 2) Define your site-specific config here
  const cfg = {
    webhookUrl: 'https://optisolutions.app.n8n.cloud/webhook/97a4f399-1475-4122-a0e4-0b8836002a56/chat',
    // Additional createChat options can go here if supported in future versions
    // e.g. requireButtonClick: false, placeholder: 'Type your question…'
  };

  // 3) Dynamically import the chat bundle
  const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
  const { createChat } = module;                                                     // :contentReference[oaicite:7]{index=7}

  // 4) Initialize the chat widget
  createChat({
    webhookUrl: cfg.webhookUrl
    // route, theme, or other options would be passed here if the API adds them
  });
})();
