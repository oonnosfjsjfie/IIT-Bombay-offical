// =====================================================
// Floating "Ask Neutrix" chat, shown on every page.
// Messages are saved in localStorage per language.
// =====================================================
(function () {
    const CHAT_KEY = 'neutrixChat';
    const chat = storeGet(CHAT_KEY) || { messages: [] };
    const save = () => storeSet(CHAT_KEY, chat);

    // ---------- Build the widget ----------
    const fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.type = 'button';
    fab.dataset.i18nTitle = 'chatOpen';
    fab.textContent = '💬';

    const panel = document.createElement('div');
    panel.className = 'chat-panel hidden';
    panel.innerHTML = `
        <div class="chat-panel-header">
            <div>
                <div class="chat-panel-title" data-i18n="chatTitle"></div>
                <div class="chat-panel-sub" data-i18n="chatHint"></div>
            </div>
            <div class="chat-head-btns">
                <button class="chat-icon-btn" id="chatClearBtn" type="button" data-i18n-title="chatClear">🗑</button>
                <button class="chat-icon-btn" id="chatCloseBtn" type="button" data-i18n-title="chatClose">✕</button>
            </div>
        </div>
        <div id="chatBox" class="chat-box"></div>
        <div class="chat-panel-footer">
            <div class="chat-input-row">
                <textarea id="questionInput" class="modern-textarea" rows="2" data-i18n-placeholder="questionPlaceholder"></textarea>
                <button id="micBtn" class="btn-secondary" type="button" data-i18n-title="micTitle">🎤</button>
                <button id="askBtn" class="btn-primary" type="button" data-i18n="askBtn"></button>
            </div>
            <p id="micStatus" class="hint"></p>
        </div>`;

    document.body.appendChild(panel);
    document.body.appendChild(fab);
    applyTexts(panel);
    fab.title = t('chatOpen');

    const chatBox = panel.querySelector('#chatBox');
    const questionInput = panel.querySelector('#questionInput');
    const askBtn = panel.querySelector('#askBtn');
    const micBtn = panel.querySelector('#micBtn');
    const micStatus = panel.querySelector('#micStatus');

    // ---------- Open / close ----------
    function setOpen(open) {
        panel.classList.toggle('hidden', !open);
        fab.textContent = open ? '✕' : '💬';
        try { localStorage.setItem('neutrixChatOpen', open ? '1' : '0'); } catch (e) {}
        if (open) {
            chatBox.scrollTop = chatBox.scrollHeight;
            questionInput.focus();
        }
    }
    fab.addEventListener('click', () => setOpen(panel.classList.contains('hidden')));
    panel.querySelector('#chatCloseBtn').addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.classList.contains('hidden')) setOpen(false);
    });
    panel.querySelector('#chatClearBtn').addEventListener('click', () => {
        chat.messages = [];
        save();
        renderAll();
    });

    // ---------- Rendering ----------
    function msgText(m) {
        return m.text[neutrixLang] || m.text.English || m.text.Malayalam || Object.values(m.text)[0] || '';
    }

    function makeBubble(role) {
        const div = document.createElement('div');
        div.className = `chat-msg ${role === 'user' ? 'user' : 'ai'}`;
        chatBox.appendChild(div);
        return div;
    }

    function fillBubble(div, m) {
        if (m.role === 'assistant') {
            div.classList.add('md-content');
            div.innerHTML = renderMarkdown(msgText(m));
        } else {
            div.textContent = msgText(m);
        }
    }

    let translateRun = 0;

    function renderAll() {
        chatBox.innerHTML = '';
        const greet = makeBubble('assistant');
        greet.textContent = t('chatGreeting');

        chat.messages.forEach((m, i) => {
            const div = makeBubble(m.role);
            div.dataset.index = i;
            fillBubble(div, m);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
        translateMissing();
    }

    // Translate old messages into the current language
    async function translateMissing() {
        const lang = neutrixLang;
        const run = ++translateRun;
        for (let i = 0; i < chat.messages.length; i++) {
            const m = chat.messages[i];
            if (m.text[lang]) continue;
            try {
                await getLocalized(m.text, lang);
                save();
            } catch (e) {
                return; // AI busy: keep showing the original
            }
            if (run !== translateRun || lang !== neutrixLang) return;
            const div = chatBox.querySelector(`[data-index="${i}"]`);
            if (div) fillBubble(div, m);
        }
    }

    // ---------- Asking ----------
    async function askQuestion() {
        const question = questionInput.value.trim();
        if (!question) return;

        const lang = neutrixLang;
        const report = loadReport();
        const history = chat.messages.slice(-6).map(m => ({ role: m.role, text: msgText(m) }));

        const userMsg = { role: 'user', text: { [lang]: question } };
        chat.messages.push(userMsg);
        save();
        const userDiv = makeBubble('user');
        userDiv.dataset.index = chat.messages.length - 1;
        fillBubble(userDiv, userMsg);

        questionInput.value = '';
        askBtn.disabled = true;
        const thinking = makeBubble('assistant');
        thinking.textContent = t('thinking');
        chatBox.scrollTop = chatBox.scrollHeight;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000);

        try {
            const res = await fetch(`${API_BASE}/api/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    report_text: reportContext(report),
                    language: lang,
                    history: history
                }),
                signal: controller.signal
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();

            const aiMsg = { role: 'assistant', text: { [lang]: data.answer } };
            chat.messages.push(aiMsg);
            save();
            thinking.dataset.index = chat.messages.length - 1;
            fillBubble(thinking, aiMsg);
        } catch (err) {
            thinking.textContent = err.name === 'AbortError'
                ? t('askTimeout')
                : t('askError', { msg: err.message });
        } finally {
            clearTimeout(timer);
            askBtn.disabled = false;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    askBtn.addEventListener('click', askQuestion);
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    });

    // ---------- Voice typing ----------
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let micKey = null;

    if (!SpeechRecognition) {
        micBtn.disabled = true;
        micKey = 'micUnsupported';
        micStatus.textContent = t(micKey);
    } else {
        const recognition = new SpeechRecognition();
        recognition.interimResults = true;
        recognition.continuous = false;
        let listening = false;
        let baseText = '';

        micBtn.addEventListener('click', () => {
            if (listening) {
                recognition.stop();
                return;
            }
            recognition.lang = neutrixLang === 'Malayalam' ? 'ml-IN' : 'en-IN';
            baseText = questionInput.value;
            recognition.start();
        });

        recognition.onstart = () => {
            listening = true;
            micBtn.classList.add('listening');
            micKey = 'micListening';
            micStatus.textContent = t(micKey);
        };
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            questionInput.value = (baseText + ' ' + transcript).trim();
        };
        recognition.onerror = (event) => {
            micKey = null;
            micStatus.textContent = event.error === 'not-allowed'
                ? t('micBlocked')
                : t('micError', { err: event.error });
        };
        recognition.onend = () => {
            listening = false;
            micBtn.classList.remove('listening');
            if (micKey === 'micListening') {
                micKey = null;
                micStatus.textContent = '';
            }
        };
    }

    // ---------- Language change ----------
    document.addEventListener('neutrix:langchange', () => {
        applyTexts(panel);
        fab.title = t('chatOpen');
        if (micKey) micStatus.textContent = t(micKey);
        renderAll();
    });

    renderAll();
    let wasOpen = false;
    try { wasOpen = localStorage.getItem('neutrixChatOpen') === '1'; } catch (e) {}
    if (wasOpen) setOpen(true);
})();