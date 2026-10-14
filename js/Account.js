document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    });

    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        alert(`Login berhasil untuk email: ${email}\nSelamat datang di PawCare!`);
        window.location.href = 'Home.html';
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        alert(`Pendaftaran berhasil!\nAkun atas nama ${name} (${email}) telah dibuat. Silakan login untuk melanjutkan.`);
        registerForm.reset();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });
});