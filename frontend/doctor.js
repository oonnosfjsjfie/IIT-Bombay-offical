let canvas, ctx;

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('mockMapCanvas');
    ctx = canvas.getContext('2d');
    
    // Draw initial empty medical localization layout preview grid
    renderMapMatrix("Kochi Base Center Node", 9.9816, 76.2999);
});

function renderMapMatrix(locationLabel, latitude, longitude) {
    if (!ctx) return;
    
    // 1. Wipe canvas clear with custom topographic coloring bounds
    ctx.fillStyle = "#e5ecf4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw layout blueprint map grid crosshair lines
    ctx.strokeStyle = "rgba(13, 110, 253, 0.15)";
    ctx.lineWidth = 1;
    
    // Generate grid lines across screen bounds
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    
    // 3. Draw automated clinical radar scanner crosshair targets
    ctx.fillStyle = "rgba(33, 37, 41, 0.04)";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // 4. Position the dynamic medical pin right on the target node intersection
    const targetX = canvas.width / 2;
    const targetY = canvas.height / 2;
    
    // Draw pulse ripple indicator
    ctx.fillStyle = "rgba(13, 110, 253, 0.2)";
    ctx.beginPath();
    ctx.arc(targetX, targetY - 10, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw solid map pin icon pin head shape
    ctx.fillStyle = "#dc3545";
    ctx.beginPath();
    ctx.arc(targetX, targetY - 15, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw map pin pin tail tip pointer shape
    ctx.beginPath();
    ctx.moveTo(targetX - 8, targetY - 10);
    ctx.lineTo(targetX, targetY);
    ctx.lineTo(targetX + 8, targetY - 10);
    ctx.closePath();
    ctx.fill();
    
    // Inner reflective core spot element highlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(targetX, targetY - 15, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 5. Overlay floating text map pin descriptive labels
    ctx.fillStyle = "#212529";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(locationLabel, targetX, targetY + 22);
    
    ctx.fillStyle = "#6c757d";
    ctx.font = "10px monospace";
    ctx.fillText(`GPS Node Coordinate: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, targetX, targetY + 36);
}

// Intercept profile form submission events
document.getElementById('doctorProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('docName').value.trim();
    const specialty = document.getElementById('docSpecialty').value.trim() || "General Medicine";
    const hospital = document.getElementById('hospitalName').value.trim();
    const city = document.getElementById('hospitalCity').value;

    const feedback = document.getElementById('docFeedback');
    const summaryArea = document.getElementById('profileSummaryBox');
    const summaryContent = document.getElementById('summaryContent');

    // Store settings profile safely inside active storage matrix slots
    localStorage.setItem('neutrix_doctor_name', name);
    localStorage.setItem('neutrix_doctor_hospital', hospital);

    feedback.innerHTML = `<div class="alert-success" style="padding:10px; font-size:13.5px;">✓ Profile registered successfully! Map node mapped.</div>`;

    // Mock coordinate switching matrices
    let lat = 9.9816; let lng = 76.2999;
    if (city === "mumbai") { lat = 19.0760; lng = 72.8777; }

    // Fire the custom offline canvas map renderer engine update dynamically
    renderMapMatrix(`${hospital} Hub Node`, lat, lng);

    // Update screen textual telemetry metrics
    summaryContent.innerHTML = `
        <p><strong>Clinician:</strong> ${name}</p>
        <p><strong>Specialty:</strong> ${specialty}</p>
        <p><strong>Facility:</strong> ${hospital}</p>
        <p><strong>Regional Center Node:</strong> Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</p>
    `;
    summaryArea.classList.remove('hidden');
});
