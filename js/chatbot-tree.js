// js/chatbot-tree.js
(function () {
  // Helpers: use functions DOM already existing if they are (for instance addMessage)
  const messagesEl = document.getElementById('chatbot-messages');
  const inputEl = document.getElementById('chatbot-input');
  const toggleEl = document.getElementById('chatbot-toggle');
  const containerEl = document.getElementById('chatbot-container');

  if (!messagesEl) {
    console.warn('chatbot-tree: #chatbot-messages not found. Make sure of having the right markup.');
    return;
  }

  // Use existing addMessage if it exists, otherwise define a minimal fallback.
  // Wrap bot messages so they route through `showBotMessage()` (typing/delay)
  // when that helper is available, while keeping original behavior for others.
  const _originalAppend = (typeof window.addMessage === 'function')
    ? window.addMessage
    : function (text) {
        const msg = document.createElement('div');
        msg.textContent = text;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      };

  const appendMessage = function (text) {
    if (typeof text === 'string' && text.trim().toLowerCase().startsWith('bot:') && typeof window.showBotMessage === 'function') {
      // Strip the "Bot: " prefix and delegate to showBotMessage which
      // will display a typing indicator and then the final message.
      const payload = text.replace(/^bot:\s*/i, '');
      window.showBotMessage(payload);
    } else {
      // Fallback to original immediate append for user messages or when
      // showBotMessage is not available.
      _originalAppend.call(window, text);
    }
  };

  // Load of data: use chatbotData if it was already loaded, otherwise fetch to js/chatbot-data.json
  async function loadData() {
    if (window.chatbotData && Object.keys(window.chatbotData).length) {
      return window.chatbotData;
    }
    try {
      const res = await fetch('js/chatbot-data.json');
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const d = await res.json();
      window.chatbotData = d;
      return d;
    } catch (err) {
      console.error('chatbot-tree: error loading js/chatbot-data.json', err);
      return null;
    }
  }

  // UI helpers
  function createQuickReplies(options) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chatbot-quick-replies';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chatbot-quick-reply';
      btn.textContent = opt.label;
      btn.dataset.id = opt.id;
      btn.setAttribute('aria-label', opt.label);
      btn.addEventListener('click', () => {
        appendMessage('You: ' + opt.label);
        handleOptionSelection(opt);
      });
      // keyboard accessibility
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
      wrapper.appendChild(btn);
    });
    return wrapper;
  }

  function clearQuickReplies() {
    const existing = messagesEl.querySelectorAll('.chatbot-quick-replies');
    existing.forEach(el => el.remove());
  }

  // History stack for back
  const historyStack = [];

  function pushHistory(nodeId) {
    if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== nodeId) {
      historyStack.push(nodeId);
    }
  }

  function popHistory() {
    historyStack.pop();
    return historyStack.length ? historyStack[historyStack.length - 1] : null;
  }

  // Handle option selection: either execute an action or navigate the tree
  function handleOptionSelection(opt) {
    if (!opt) return;
    // If option has an action, handle it
    if (opt.action && typeof opt.action === 'object') {
      const a = opt.action;
      // Common types: link, external, phone, info
      if (a.type === 'link') {
        appendMessage('Bot: Opening link...');
        // small delay so user sees typing/ack
        setTimeout(() => {
          try {
            if (a.newTab) window.open(a.url, '_blank');
            else window.location.href = a.url;
          } catch (e) {
            console.error('chatbot: failed to open link', e);
          }
        }, 300);
        return;
      }

      if (a.type === 'external') {
        try {
          // open validated external link in new tab
          const url = a.url;
          if (typeof url === 'string') window.open(url, '_blank');
        } catch (e) { console.error(e); }
        return;
      }

      if (a.type === 'phone') {
        const number = a.payload || a.phone || a.number || '';
        appendMessage('Bot: You can call ' + number);
        // add a clickable tel: link as a final DOM node (not using addMessage text)
        try {
          const link = document.createElement('a');
          link.href = 'tel:' + number;
          link.textContent = 'Call: ' + number;
          link.className = 'chatbot-phone-link';
          messagesEl.appendChild(link);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        } catch (e) { /* ignore */ }
        return;
      }

      if (a.type === 'info') {
        const payload = a.payload;
        if (Array.isArray(payload)) {
          payload.forEach(line => appendMessage('Bot: ' + line));
        } else if (payload) {
          appendMessage('Bot: ' + payload);
        }
        return;
      }

      // unknown action type -> fallback to navigate if id exists
      if (opt.id) {
        showNode(opt.id);
        return;
      }
    }

    // No action: default behavior -> navigate node id
    if (opt.id) showNode(opt.id);
  }

  // Render node (text + options or content)
  async function showNode(nodeId) {
    const data = await loadData();
    if (!data) {
      appendMessage('Bot: Sorry, the info could not be loaded now.');
      return;
    }
    const nodes = data.nodes || {};
    const node = nodes[nodeId] || (nodeId === 'welcome' ? data.welcome : null) || null;

    if (!node) {
      // fallback al default
      appendMessage('Bot: ' + (data.default && data.default.text ? data.default.text : "I don't have that info."));
      clearQuickReplies();
      if (data.default && data.default.options) {
        const qr = createQuickReplies(data.default.options);
        messagesEl.appendChild(qr);
        const first = qr.querySelector('button');
        if (first) first.focus();
      }
      return;
    }

    // Push current node to history (so "Back" returns back)
    pushHistory(nodeId);

    // Show node text — delegate multi-line rendering to showBotMessage
    if (node.text) {
      if (typeof window.showBotMessage === 'function') {
        // pass the original string (may contain \n) so UI helper groups paragraphs
        window.showBotMessage(node.text);
      } else {
        appendMessage('Bot: ' + node.text);
      }
    }

    clearQuickReplies();

    // Show content lines if exists — render as a grouped block when possible
    if (node.content && Array.isArray(node.content)) {
      if (typeof window.showBotMessage === 'function') {
        window.showBotMessage(node.content);
      } else {
        node.content.forEach(line => appendMessage('Bot: ' + line));
      }
    }

    // Render options if available
    if (node.options && Array.isArray(node.options) && node.options.length) {
      const qr = createQuickReplies(node.options);
      messagesEl.appendChild(qr);
      // focus to first button for accessibility
      const first = qr.querySelector('button');
      if (first) first.focus();
      // add a "Back" button after options (if we are not on Welcome)
      if (nodeId !== 'welcome' && nodeId !== 'default') {
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'chatbot-back-button';
        backBtn.textContent = 'Back';
        backBtn.addEventListener('click', () => {
          const prev = popHistory();
          // if prev is the same (by push), get prev on stack
          const target = historyStack.length ? historyStack[historyStack.length - 1] : 'welcome';
          appendMessage('You: Back');
          // show target or welcome
          if (target) showNode(target);
          else showNode('welcome');
        });
        messagesEl.appendChild(backBtn);
      }
    }
  }

  // Show welcome (and mark that we showed it this session)
  let welcomeShown = sessionStorage.getItem('sw_chatbot_welcome') === '1';

  async function showWelcomeOnce() {
    if (welcomeShown) return;
    const data = await loadData();
    if (!data) return;
    // show welcome
    if (data.welcome && data.welcome.text) {
      appendMessage('Bot: ' + data.welcome.text);
    }
    if (data.welcome && data.welcome.options) {
      const qr = createQuickReplies(data.welcome.options);
      messagesEl.appendChild(qr);
      const first = qr.querySelector('button');
      if (first) first.focus();
    }
    welcomeShown = true;
    sessionStorage.setItem('sw_chatbot_welcome', '1');
    // push welcome to history
    historyStack.length = 0;
    historyStack.push('welcome');
  }

  // Init: show welcome when container becomes visible or when toggle clicked
  function watchOpen() {
    if (toggleEl) {
      toggleEl.addEventListener('click', () => {
        // slight delay to allow existing toggle handler to set display
        requestAnimationFrame(() => {
          const style = window.getComputedStyle(containerEl);
          const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          if (visible) {
                showWelcomeOnce();
                // If welcome was already shown in sessionStorage but the messages
                // container is empty (race or previous state), force-render the
                // welcome node after a short delay to account for async loading.
                setTimeout(() => {
                  const msgs = document.getElementById('chatbot-messages');
                  if (msgs && msgs.children.length === 0) {
                    // showNode will load data if needed and render options
                    if (typeof showNode === 'function') showNode('welcome');
                  }
                }, 300);
            // also adjust wrapper position if function exists
            if (typeof window.adjustChatbotWrapperPosition === 'function') {
              window.adjustChatbotWrapperPosition();
            }
          }
        });
      });
    } else {
      // no toggle button; show welcome on load
      showWelcomeOnce();
      // same fallback: if nothing rendered, force the welcome node
      setTimeout(() => {
        const msgs = document.getElementById('chatbot-messages');
        if (msgs && msgs.children.length === 0) {
          if (typeof showNode === 'function') showNode('welcome');
        }
      }, 300);
    }
  }

  // Allow text input to search the tree (simple contains match on labels/texts)
  async function handleTextQuery(query) {
    if (!query) return;
    const data = await loadData();
    if (!data) return;
    // Normalize
    const q = query.toLowerCase();
    // Search in options labels and nodes text
    // First search in welcome options
    const allOptions = [];
    const welcomeOpts = (data.welcome && data.welcome.options) || [];
    welcomeOpts.forEach(o => allOptions.push(o));
    const nodes = data.nodes || {};
    Object.keys(nodes).forEach(k => {
      const n = nodes[k];
      if (n.options && Array.isArray(n.options)) {
        n.options.forEach(o => allOptions.push(o));
      }
      // also add nodes themselves as selectable results
      allOptions.push({ id: k, label: n.text || k });
    });

    // Find best match (first where label contains q)
    const match = allOptions.find(o => (o.label || '').toLowerCase().includes(q));
    if (match) {
      appendMessage('You: ' + query);
      showNode(match.id);
    } else {
      // fallback
      appendMessage('You: ' + query);
      appendMessage('Bot: ' + (data.default && data.default.text ? data.default.text : "I didn't find any answer."));

      if (data.default && data.default.options) {
        const qr = createQuickReplies(data.default.options);
        messagesEl.appendChild(qr);
        const first = qr.querySelector('button');
        if (first) first.focus();
      }
    }
  }

  // Bind input (Enter)
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (!q) return;
        handleTextQuery(q);
        e.target.value = '';
      }
    });
  }

  // Expose small API
  window.chatbotTree = {
    showNode,
    showWelcomeOnce,
    handleTextQuery
  };

  // Start
  watchOpen();

})();