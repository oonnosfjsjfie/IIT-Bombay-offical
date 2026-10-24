document.getElementById('selectPatient').addEventListener('click', function() {
    localStorage.setItem('neutrix_user_role', 'patient');
    window.location.href = '/frontend/index.html'; // Routes straight to your main dashboard hub!
});

document.getElementById('selectDoctor').addEventListener('click', function() {
    localStorage.setItem('neutrix_user_role', 'doctor');
    window.location.href = '/frontend/doctor.html'; // Routes to the designated doctor view shell
});

// Card Hover Interface Highlight Logic
const cards = [document.getElementById('selectPatient'), document.getElementById('selectDoctor')];
cards.forEach(card => {
    card.addEventListener('mouseenter', () => card.style.borderColor = '#0d6efd');
    card.addEventListener('mouseleave', () => card.style.borderColor = '#dee2e6');
});
