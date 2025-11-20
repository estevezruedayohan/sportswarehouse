
const chatbotToggle = document.getElementById("chatbot-toggle");
const chatbotContainer = document.getElementById("chatbot-container");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotInput = document.getElementById("chatbot-input");

// Expose chatbot data on the window so other modules can read it
window.chatbotData = window.chatbotData || {};

// Load chatbot data and store on window.chatbotData
fetch('js/chatbot-data.json')
  .then(response => {
    if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
    return response.json();
  })
  .then(data => {
    window.chatbotData = data;
    console.info('chatbot: data loaded', Object.keys(data || {}));
  })
  .catch(err => {
    console.error('chatbot: failed to load chatbot-data.json', err);
  });

// Toggle chatbot visibility
// Focus trap state
let _previousActiveElement = null;
let _focusTrapHandler = null;

function _getFocusableElements(container) {
  const selectors = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selectors)).filter(el => {
    // filter visible elements
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  });
}

function _enableFocusTrap(container, restoreFocusTo) {
  if (!_focusTrapHandler) {
    _previousActiveElement = document.activeElement;
    const focusable = _getFocusableElements(container);
    // focus the first focusable element or the input
    const toFocus = focusable.length ? focusable[0] : container.querySelector('input, button, [tabindex]');
    if (toFocus) toFocus.focus();

    _focusTrapHandler = function (e) {
      if (e.key === 'Escape') {
        // close container
        container.style.display = 'none';
        try { chatbotToggle.setAttribute('aria-expanded', 'false'); chatbotContainer.setAttribute('aria-hidden', 'true'); } catch (err){}
        _disableFocusTrap();
        if (restoreFocusTo) restoreFocusTo.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = _getFocusableElements(container);
      if (!list.length) { e.preventDefault(); return; }
      const idx = list.indexOf(document.activeElement);
      const last = list.length - 1;
      if (e.shiftKey) {
        if (idx === 0 || document.activeElement === container) {
          list[last].focus();
          e.preventDefault();
        }
      } else {
        if (idx === last) {
          list[0].focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', _focusTrapHandler);
  }
}

function _disableFocusTrap() {
  if (_focusTrapHandler) {
    document.removeEventListener('keydown', _focusTrapHandler);
    _focusTrapHandler = null;
  }
  if (_previousActiveElement && typeof _previousActiveElement.focus === 'function') {
    try { _previousActiveElement.focus(); } catch (e) {}
  }
  _previousActiveElement = null;
}

chatbotToggle.addEventListener("click", () => {
  const nowOpen = chatbotContainer.style.display !== 'flex';
  chatbotContainer.style.display = nowOpen ? 'flex' : 'none';
  chatbotContainer.style.flexDirection = 'column';
  try {
    chatbotToggle.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    chatbotContainer.setAttribute('aria-hidden', nowOpen ? 'false' : 'true');
  } catch (e) { /* ignore */ }

  if (nowOpen) {
    // enable focus trap and focus inside
    _enableFocusTrap(chatbotContainer, chatbotToggle);
  } else {
    // disable trap and restore focus
    _disableFocusTrap();
  }
});

// User input is handled by the chatbot-tree module when present.
// The legacy input handler was removed to avoid duplicate processing
// and incorrect rendering when the data nodes are objects.

function addMessage(text) {
  const msg = document.createElement("div");
  // Add simple classes so CSS can style bot vs user messages
  if (typeof text === 'string') {
    const t = text.trim();
    if (/^you:/i.test(t)) msg.className = 'chatbot-msg chatbot-msg--user';
    else if (/^bot:/i.test(t)) msg.className = 'chatbot-msg chatbot-msg--bot';
    else msg.className = 'chatbot-msg';
  } else {
    msg.className = 'chatbot-msg';
  }
  msg.textContent = text;
  chatbotMessages.appendChild(msg);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

