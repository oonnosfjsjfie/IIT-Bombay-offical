document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const feedback = document.getElementById('loginFeedback');

    const testEmail = "team@neutrinos.com";
    const testPassword = "neutrixpassword123";

    if (email === testEmail && password === testPassword) {
        feedback.innerHTML = `<div class="alert-success" style="padding: 10px; margin-top: 15px; text-align: center;">✓ Access Granted! Redirecting...</div>`;
        
        localStorage.setItem('neutrix_authenticated', 'true');

        // Redirects directly to the specialized role allocation dashboard view
        setTimeout(() => {
            window.location.href = '/frontend/role.html';
        }, 1000);
    } else {
        feedback.innerHTML = `<div class="alert-danger" style="padding: 10px; margin-top: 15px; text-align: center;">✗ Invalid email address or password. Try again.</div>`;
    }
});
