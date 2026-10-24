document.addEventListener('DOMContentLoaded', displayMedicines);

document.getElementById('medForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('medName').value.trim();
    const dose = document.getElementById('medDose').value.trim();
    const time = document.getElementById('medTime').value;
    const food = document.getElementById('medFood').value;
    const duration = document.getElementById('medDuration').value;

    const currentMeds = JSON.parse(localStorage.getItem('neutrix_meds')) || [];
    currentMeds.push({ name, dose, time, food, duration });
    localStorage.setItem('neutrix_meds', JSON.stringify(currentMeds));

    document.getElementById('medForm').reset();
    displayMedicines();
});

function displayMedicines() {
    const listContainer = document.getElementById('medScheduleList');
    let currentMeds = JSON.parse(localStorage.getItem('neutrix_meds')) || [];

    if (currentMeds.length === 0) {
        listContainer.innerHTML = `<p class="caption">No active tracking regimens configured yet.</p>`;
        return;
    }

    let html = `<ul style="list-style:none; padding:0;">`;
    currentMeds.forEach(med => {
        html += `
            <li style="padding:12px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px; margin-bottom:10px; line-height:1.5;">
                <strong>💊 ${med.name}</strong> — ${med.dose} — ⏱️ ${med.time} — 🍽️ ${med.food} — 📅 ${med.duration} Days
            </li>`;
    });
    html += `</ul>`;
    listContainer.innerHTML = html;
}
