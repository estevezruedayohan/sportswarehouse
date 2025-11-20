// js/chatbot-ui.js
// Helper that shows bot messages with a typing indicator and renders
// multi-line text as a single message block containing paragraphs.
(function () {
  const TYPING_MIN = 300;
  const TYPING_PER_CHAR = 18;
  const MAX_TYPING = 1500;

  function createTypingElement() {
    const typing = document.createElement('div');
    typing.className = 'chatbot-typing';
    typing.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'chatbot-typing-dot';
      typing.appendChild(dot);
    }
    return typing;
  }

  // Render a bot message. `content` can be a string (possibly with \n) or an array of strings.
  function renderBotBlock(messagesEl, content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chatbot-msg chatbot-msg--bot';

    // Normalize to array of paragraphs
    let paragraphs = [];
    if (Array.isArray(content)) {
      paragraphs = content.map(x => String(x || '').trim()).filter(Boolean);
    } else if (typeof content === 'string') {
      paragraphs = content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    } else {
      paragraphs = [String(content)];
    }

    // If there's only one paragraph, render as text inside the wrapper
    if (paragraphs.length === 1) {
      const p = document.createElement('p');
      p.textContent = paragraphs[0];
      wrapper.appendChild(p);
    } else {
      paragraphs.forEach((ptext) => {
        const p = document.createElement('p');
        p.textContent = ptext;
        wrapper.appendChild(p);
      });
    }

    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function showBotMessage(textOrArray) {
    const messagesEl = document.getElementById('chatbot-messages');
    if (!messagesEl) {
      // fallback
      if (Array.isArray(textOrArray)) textOrArray = textOrArray.join('\n');
      if (typeof window.addMessage === 'function') return window.addMessage('Bot: ' + textOrArray);
      return console.log('Bot: ' + textOrArray);
    }

    const typingEl = createTypingElement();
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const lengthEstimate = Array.isArray(textOrArray) ? textOrArray.join(' ').length : String(textOrArray || '').length;
    const delay = Math.min(MAX_TYPING, TYPING_MIN + (lengthEstimate * TYPING_PER_CHAR));
    await new Promise(r => setTimeout(r, delay));

    typingEl.remove();

    // Render the bot block directly (avoiding window.addMessage to ensure structure)
    renderBotBlock(messagesEl, textOrArray);
  }

  // Minimal addMessage fallback for other code that expects it
  if (typeof window.addMessage !== 'function') {
    window.addMessage = function (text) {
      const messages = document.getElementById('chatbot-messages');
      if (!messages) return;
      const d = document.createElement('div');
      d.textContent = text;
      d.className = 'chatbot-msg';
      // mark visually whether it's bot or user
      if (typeof text === 'string' && text.toLowerCase().startsWith('bot:')) d.classList.add('chatbot-msg--bot');
      else d.classList.add('chatbot-msg--user');
      messages.appendChild(d);
      messages.scrollTop = messages.scrollHeight;
    };
  }

  window.showBotMessage = showBotMessage;

})();