// chat-widget.js

// 1) Load the official CSS for @n8n/chat
const styleLink = document.createElement('link');
styleLink.rel  = 'stylesheet';
styleLink.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
document.head.append(styleLink);  // :contentReference[oaicite:4]{index=4}

// 2) Override CSS variables for modern, rounded UI
const root = document.documentElement;
root.style.setProperty('--chat--color-primary',          '#e74266');
root.style.setProperty('--chat--color-primary-shade-50', '#db4061');
root.style.setProperty('--chat--color-secondary',        '#f472b6');
root.style.setProperty('--chat--color-light',            '#f9fafb');
root.style.setProperty('--chat--border-radius',          '1rem');
root.style.setProperty('--chat--spacing',                '1rem');
root.style.setProperty('--chat--header--background',     '#e74266');
root.style.setProperty('--chat--header--color',          '#ffffff');
root.style.setProperty('--chat--textarea--height',       '3rem');
root.style.setProperty('--chat--toggle--size',           '56px');  // :contentReference[oaicite:5]{index=5}

// 3) Inject custom CSS for logo-only header, footer redesign, and hide “powered by”
const customCSS = document.createElement('style');
customCSS.textContent = `
  /* Header: hide default text and inject your logo */
  .n8n-chat-widget .chat-header__heading,
  .n8n-chat-widget .chat-header__subtitle {
    display: none !important;
  }
  .n8n-chat-widget .chat-header {
    background-color: var(--chat--header--background) !important;
    color: var(--chat--header--color) !important;
    background-image: url('https://cdn.brandfetch.io/idO6_6uqJ9/w/600/h/600/idOexD9O9s.png?c=1bfwsmEH202zzEfSNTed');
    background-repeat: no-repeat;
    background-position: calc(var(--chat--spacing)) center;
    background-size: 32px 32px;
    padding-left: calc(32px + var(--chat--spacing));
  }

  /* Footer: pill-shaped input + gradient button */
  .n8n-chat-widget .chat-footer {
    display: flex;
    align-items: center;
    padding: var(--chat--spacing);
    background: var(--chat--color-light);
    border-top: 1px solid rgba(0,0,0,0.1);
  }
  .n8n-chat-widget .chat-footer textarea {
    flex: 1;
    height: var(--chat--textarea--height);
    padding: 0 calc(var(--chat--spacing));
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: var(--chat--border-radius);
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
    resize: none;
  }
  .n8n-chat-widget .chat-footer button {
    margin-left: var(--chat--spacing);
    height: var(--chat--textarea--height);
    padding: 0 1.5rem;
    border: none;
    border-radius: var(--chat--border-radius);
    background: linear-gradient(135deg, var(--chat--color-primary), var(--chat--color-primary-shade-50));
    color: #fff;
    font-weight: 500;
    cursor: pointer;
  }

  /* Remove any “powered by n8n” link */
  .n8n-chat-widget .chat-footer__powered-by {
    display: none !important;
  }
`;
document.head.append(customCSS);  // :contentReference[oaicite:6]{index=6}

// 4) Load the chat bundle and initialize with your settings
(async () => {
  const { createChat } = await import(
    'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js'
  );  // :contentReference[oaicite:7]{index=7}

  createChat({
    webhookUrl: 'https://optisolutions.app.n8n.cloud/webhook/97a4f399-1475-4122-a0e4-0b8836002a56/chat',
    mode: 'window',
    target: 'body',
    showWelcomeScreen: false,
    initialMessages: [
      'Hi, how can I help you today?'
    ],  // :contentReference[oaicite:8]{index=8}
    i18n: {
      en: {
        title: '',
        subtitle: '',
        footer: '',
        inputPlaceholder: 'Type your message here…'
      }
    }
  });  // :contentReference[oaicite:9]{index=9}
})();
