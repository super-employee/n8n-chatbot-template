// chat-widget.js
// ─────────────────────────────────────────────────────────────────────────────
// 1) Inject the official chat stylesheet
const styleLink = document.createElement('link');
styleLink.rel  = 'stylesheet';
styleLink.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
document.head.append(styleLink);

// 2) Tweak CSS variables for a modern look
const root = document.documentElement;
root.style.setProperty('--chat--color-primary',           '#e74266');  // pinkish
root.style.setProperty('--chat--color-primary-shade-50',  '#db4061');
root.style.setProperty('--chat--color-secondary',         '#f472b6');  // lighter pink
root.style.setProperty('--chat--color-light',             '#f9fafb');  // background
root.style.setProperty('--chat--color-light-shade-50',    '#f3f4f6');
root.style.setProperty('--chat--border-radius',           '0.75rem');
root.style.setProperty('--chat--spacing',                 '0.75rem');
root.style.setProperty('--chat--header--background',      'var(--chat--color-light)');
root.style.setProperty('--chat--header--border-bottom',   '1px solid rgba(0,0,0,0.05)');
root.style.setProperty('--chat--header--color',           '#333333');
root.style.setProperty('--chat--subtitle--font-size',     '0.875rem');
root.style.setProperty('--chat--textarea--height',        '48px');
root.style.setProperty('--chat--toggle--size',            '56px');
root.style.setProperty('--chat--message--border-radius',  '0.75rem');

// 3) Load the chat bundle and initialize
(async () => {
  const { createChat } = await import(
    'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js'
  );

  createChat({
    webhookUrl: 'https://optisolutions.app.n8n.cloud/webhook/97a4f399-1475-4122-a0e4-0b8836002a56/chat',
    mode: 'window',
    target: 'body',
    showWelcomeScreen: true,
    initialMessages: [
      'Hi, how can I help you today?'
    ],
    i18n: {
      en: {
        title:   'nocodecreative.io',
        subtitle: '',
        inputPlaceholder: 'Type your message here…'
      }
    }
  });
})();
