const openLastBtn = document.getElementById('openLastBtn');
if (storeGet('neutrixReport')) openLastBtn.classList.remove('hidden');
openLastBtn.addEventListener('click', () => {
    window.location.href = 'report.html';
});

document.getElementById('processBtn').addEventListener('click', async () => {
    const processBtn = document.getElementById('processBtn');
    const reports = window.neutrixUploads.pdf;
    const bills = window.neutrixUploads.bill;
    const language = window.neutrixLang;
    const resultOutput = document.getElementById('resultOutput');
    const aiTextResponse = document.getElementById('aiTextResponse');

    if (reports.length === 0) {
        showStatus('warning', 'noFile');
        return;
    }

    const formData = new FormData();
    reports.forEach(file => formData.append("files", file));
    bills.forEach(file => formData.append("bills", file));
    formData.append("language", language);

    showStatus('info', 'loading');
    resultOutput.classList.add('hidden');
    processBtn.disabled = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);

    try {
        const response = await fetch(`${API_BASE}/api/summarize`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timer);

        if (!response.ok) {
            throw new Error(`Server returned error code: ${response.status}`);
        }

        const data = await response.json();

        if (data.ok === false) {
            showStatus('error', 'rawMsg', { msg: data.summary });
            return;
        }

        const record = {
            summaries: { [language]: data.summary },
            reportText: data.transcription || "",
            billText: data.bill_text || "",
            language: language,
            dischargeName: reports.map(f => f.name).join(', '),
            billName: bills.map(f => f.name).join(', '),
            createdAt: new Date().toISOString()
        };

        if (storeSet('neutrixReport', record)) {
            try {
                localStorage.removeItem('neutrixPlan');
                localStorage.removeItem('neutrixCheckups');
            } catch (e) {}
            showStatus('success', 'redirecting');
            setTimeout(() => { window.location.href = 'report.html'; }, 700);
        } else {
            showStatus('warning', 'storageFail');
            aiTextResponse.innerHTML = renderMarkdown(data.summary);
            resultOutput.classList.remove('hidden');
        }

    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            showStatus('error', 'timeout');
        } else {
            showStatus('error', 'serverError', { msg: err.message });
        }
    } finally {
        processBtn.disabled = false;
    }
});