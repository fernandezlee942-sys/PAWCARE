document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Tombol pindah ke form register
    goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    });

    // Tombol pindah ke form login
    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    // Proses Submit Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (result.success) {
                alert(`Selamat datang kembali, ${result.user.name} (${result.user.role})!`);
                
                // Simpan data sesi sementara di browser
                localStorage.setItem('userName', result.user.name);
                localStorage.setItem('userRole', result.user.role);

                // Pindah ke halaman index.html
                window.location.href = 'index.html';
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Terjadi kesalahan saat menghubungkan ke server.');
        }
    });

    // Proses Submit Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const result = await response.json();

            if (result.success) {
                alert(`${result.message} Silakan login dengan akun baru Anda.`);
                registerForm.reset();
                registerBox.classList.add('hidden');
                loginBox.classList.remove('hidden');
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Terjadi kesalahan saat menghubungkan ke server.');
        }
    });
});