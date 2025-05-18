// chat-widget.js

// 1) Load the official @n8n/chat CSS
const cssLink = document.createElement('link');
cssLink.rel  = 'stylesheet';
cssLink.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
document.head.append(cssLink);

// 2) Tweak CSS variables for rounded, modern UI
const root = document.documentElement;
root.style.setProperty('--chat--color-primary',           '#e74266');
root.style.setProperty('--chat--color-primary-shade-50',  '#db4061');
root.style.setProperty('--chat--color-secondary',         '#f472b6');
root.style.setProperty('--chat--color-light',             '#f9fafb');
root.style.setProperty('--chat--color-light-shade-50',    '#f3f4f6');
root.style.setProperty('--chat--border-radius',           '1rem');
root.style.setProperty('--chat--spacing',                 '1rem');
root.style.setProperty('--chat--header--background',      '#e74266');
root.style.setProperty('--chat--header--color',           '#ffffff');
root.style.setProperty('--chat--textarea--height',        '3rem');
root.style.setProperty('--chat--toggle--size',            '56px');
root.style.setProperty('--chat--message--border-radius',  '1rem');

// 3) Inject custom CSS for header, footer, bubbles & hide “powered by”
const override = document.createElement('style');
override.textContent = `
  /* — Header: only logo, solid bg — */
  .n8n-chat-widget .chat-header__heading,
  .n8n-chat-widget .chat-header__subtitle {
    display: none !important;
  }
  .n8n-chat-widget .chat-header {
    background: var(--chat--header--background) !important;
    color: var(--chat--header--color) !important;
    background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Apple_logo_white.svg/1724px-Apple_logo_white.svg.png');
    background-repeat: no-repeat;
    background-position: var(--chat--spacing) center;
    background-size: 32px 32px;
    padding-left: calc(32px + var(--chat--spacing));
  }

  /* — Input area: pill-shaped textarea + gradient button — */
  .n8n-chat-widget .chat-input {
    padding: var(--chat--spacing) !important;
    background: var(--chat--color-light) !important;
    border-top: 1px solid rgba(0,0,0,0.1) !important;
    display: flex;
    align-items: center;
    gap: var(--chat--spacing) !important;
  }
  .n8n-chat-widget .chat-input textarea {
    flex: 1;
    height: var(--chat--textarea--height) !important;
    padding: 0 var(--chat--spacing) !important;
    border: 1px solid rgba(0,0,0,0.1) !important;
    border-radius: var(--chat--border-radius) !important;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1) !important;
    background: #fff !important;
    resize: none;
  }
  .n8n-chat-widget .chat-input button {
    flex: 0 0 auto;
    height: var(--chat--textarea--height) !important;
    padding: 0 1.5rem !important;
    border: none !important;
    border-radius: var(--chat--border-radius) !important;
    background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-primary-shade-50)) !important;
    color: #fff !important;
    font-weight: 500 !important;
    cursor: pointer;
  }

  /* — Message bubbles: user = gradient, bot = light border — */
  .n8n-chat-widget .chat-message.user {
    background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-primary-shade-50)) !important;
    color: #fff !important;
    border-radius: var(--chat--message--border-radius) !important;
    box-shadow: 0 4px 12px rgba(133,79,255,0.2) !important;
  }
  .n8n-chat-widget .chat-message.bot {
    background: var(--chat--color-light-shade-50) !important;
    color: #333 !important;
    border: 1px solid rgba(0,0,0,0.1) !important;
    border-radius: var(--chat--message--border-radius) !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
  }

  /* — Hide “Powered by n8n” — */
  .n8n-chat-widget .chat-footer__powered-by {
    display: none !important;
  }
`;
document.head.append(override);

// 4) Load the chat bundle and initialize
(async () => {
  const { createChat } = await import(
    'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js'
  );  // :contentReference[oaicite:2]{index=2}

  createChat({
    webhookUrl: 'https://optisolutions.app.n8n.cloud/webhook/97a4f399-1475-4122-a0e4-0b8836002a56/chat',
    mode: 'window',
    target: 'body',
    showWelcomeScreen: false,
    initialMessages: [
      'Hi, how can I help you today?'
    ],
    i18n: {
      en: {
        title: '',                   // no text header
        subtitle: '',
        inputPlaceholder: 'Type your message here…'
      }
    }
  });
})();
