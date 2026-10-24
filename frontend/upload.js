let currentExtractedText = "";

document.getElementById('extractBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('docUploadInput');
    const status = document.getElementById('uploadStatus');
    const resultsPanel = document.getElementById('extractionResults');
    const textDisplay = document.getElementById('extractedTextDisplay');

    if (fileInput.files.length === 0) {
        status.innerHTML = `<div class="alert-warning">Please choose a PDF document before processing.</div>`;
        return;
    }

    const payload = new FormData();
    payload.append("file", fileInput.files[0]);
    payload.append("language", "English");

    status.innerHTML = `<div class="alert-success" style="background:#e2f0d9; color:#385723; border-color:#d3ebd0;">🔄 Processing document blocks...</div>`;
    resultsPanel.classList.add('hidden');

    try {
        const res = await fetch('http://127.0.0', {
            method: 'POST',
            body: payload
        });
        
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const data = await res.json();
        
        status.innerHTML = `<div class="alert-success">Text extraction complete!</div>`;
        currentExtractedText = data.summary;
        textDisplay.value = currentExtractedText;
        resultsPanel.classList.remove('hidden');
    } catch (err) {
        status.innerHTML = `<div class="alert-warning" style="background:#f8d7da; color:#842029; border-color:#f5c2c7;">System error: Ensure backend server (port 8000) is active.</div>`;
    }
});

document.getElementById('downloadTxtBtn').addEventListener('click', () => {
    if (!currentExtractedText) return;
    const blob = new Blob([currentExtractedText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'extracted_text.txt';
    link.click();
});
