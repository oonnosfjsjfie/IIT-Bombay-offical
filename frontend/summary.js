// The raw PDF text is kept here (not shown) so the chat can use it
window.neutrixReportText = "";

document.getElementById('processBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('pdfFile');
    const langSelect = document.getElementById('langSelect').value;
    const resultOutput = document.getElementById('resultOutput');
    const aiTextResponse = document.getElementById('aiTextResponse');

    if (fileInput.files.length === 0) {
        showStatus('warning', 'noFile');
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("language", langSelect);

    // Loading state
    showStatus('info', 'loading');
    resultOutput.classList.add('hidden');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
        const response = await fetch('http://127.0.0.1:8000/api/summarize', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timer);

        if (!response.ok) {
            throw new Error(`Server returned error code: ${response.status}`);
        }

        const data = await response.json();

        // Save the raw text for the chat
        window.neutrixReportText = data.transcription || "";

        showStatus('success', 'success');

        // Show the AI summary, nicely formatted
        aiTextResponse.innerHTML = window.renderMarkdown(data.summary);
        resultOutput.classList.remove('hidden');

    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            showStatus('error', 'timeout');
        } else {
            showStatus('error', 'serverError', { msg: err.message });
        }
    }
});