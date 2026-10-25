let currentExtractedText = "";

document.getElementById('extractBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('docUploadInput');
    const status = document.getElementById('uploadStatus');
    const resultsPanel = document.getElementById('extractionResults');
    const textDisplay = document.getElementById('extractedTextDisplay');

    if (fileInput.files.length === 0) {
        status.innerHTML = `<div class="alert-warning">Please select a record PDF first.</div>`;
        return;
    }
    const payload = new FormData();
    payload.append("file", fileInput.files[0]);
    payload.append("language", "English");

    status.innerHTML = `<div class="alert-success">🔄 Ingesting document text frames via FastAPI operational ports...</div>`;
    resultsPanel.classList.add('hidden');

    try {
        const res = await fetch('http://127.0.0', { method: 'POST', body: payload });
        const data = await res.json();
        
        status.innerHTML = `<div class="alert-success">✓ Extraction complete.</div>`;
        currentExtractedText = data.summary;
        textDisplay.value = currentExtractedText;
        resultsPanel.classList.remove('hidden');

        // ============================================================
        // 🔥 THE AUTOMATED NEUTRIX SMART CLINICAL DRUG SCHEDULER BRIDGE
        // ============================================================
        const textLower = currentExtractedText.toLowerCase();
        let medsScheduleList = JSON.parse(localStorage.getItem('neutrix_meds')) || [];
        
        const knownPrescriptionLibrary = [
            { name: "Paracetamol", dose: "500mg (1 Tablet)", time: "08:00", food: "After Food", duration: "5" },
            { name: "Amoxicillin", dose: "250mg (1 Capsule)", time: "13:00", food: "After Food", duration: "7" },
            { name: "Ibuprofen", dose: "400mg (1 Tablet)", time: "20:00", food: "Before Food", duration: "3" }
        ];

        let autoAddedCount = 0;
        knownPrescriptionLibrary.forEach(med => {
            if (textLower.includes(med.name.toLowerCase())) {
                const alreadyRegistered = medsScheduleList.some(item => item.name.toLowerCase() === med.name.toLowerCase());
                if (!alreadyRegistered) {
                    medsScheduleList.push(med);
                    autoAddedCount++;
                }
            }
        });

        if (autoAddedCount > 0) {
            localStorage.setItem('neutrix_meds', JSON.stringify(medsScheduleList));
            status.innerHTML += `<div class="alert-success" style="margin-top:10px; background:#e2f0d9; color:#385723; border-color:#d3ebd0;">💡 AI Data Pipeline: Successfully synced and mapped ${autoAddedCount} prescriptions straight into the Medicine Plan!</div>`;
        }
    } catch (err) {
        status.innerHTML = `<div class="alert-warning">API connection timed out. Verify python backend/main.py is tracking on port 8000.</div>`;
    }
});
