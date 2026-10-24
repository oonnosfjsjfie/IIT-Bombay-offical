const chatBox = document.getElementById('chatBox');
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');
const chatHistory = [];

function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question) return;

    const language = document.getElementById('langSelect').value;
    const reportText = window.neutrixReportText || "";

    addMessage('user', question);
    questionInput.value = '';
    askBtn.disabled = true;
    const thinking = addMessage('ai', t('thinking'));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
        const res = await fetch('http://127.0.0.1:8000/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                report_text: reportText,
                language: language,
                history: chatHistory.slice(-6)
            }),
            signal: controller.signal
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();

        // Show the answer, nicely formatted
        thinking.classList.add('md-content');
        thinking.innerHTML = window.renderMarkdown(data.answer);

        chatHistory.push({ role: 'user', text: question });
        chatHistory.push({ role: 'assistant', text: data.answer });

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

// Enter sends, Shift + Enter makes a new line
questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askQuestion();
    }
});

// ----- Voice typing (mic) -----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    micBtn.disabled = true;
    micStatus.textContent = t('micUnsupported');
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
        const language = document.getElementById('langSelect').value;
        recognition.lang = language === 'Malayalam' ? 'ml-IN' : 'en-IN';
        baseText = questionInput.value;
        recognition.start();
    });

    recognition.onstart = () => {
        listening = true;
        micBtn.classList.add('listening');
        micStatus.textContent = t('micListening');
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        questionInput.value = (baseText + ' ' + transcript).trim();
    };

    recognition.onerror = (event) => {
        micStatus.textContent = event.error === 'not-allowed'
            ? t('micBlocked')
            : t('micError', { err: event.error });
    };

    recognition.onend = () => {
        listening = false;
        micBtn.classList.remove('listening');
        if (micStatus.textContent.startsWith('🎙️')) micStatus.textContent = '';
    };
}