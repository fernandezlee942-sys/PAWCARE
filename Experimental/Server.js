const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Endpoint Register
app.post('/api/register', (req, res) => {
    const { name, email, password, role = 'user' } = req.body;
    const jsonDir = path.join(__dirname, 'json');
    const filePath = path.join(jsonDir, 'user.data');

    // Buat folder 'json' jika belum ada
    if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir);
    }

    let users = [];
    if (fs.existsSync(filePath)) {
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            users = JSON.parse(fileData);
        } catch (err) {
            users = [];
        }
    }

    // Cek apakah email sudah terdaftar
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
    }

    // Simpan data user baru
    users.push({ name, email, password, role });
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    res.json({ success: true, message: 'Pendaftaran berhasil!' });
});

// Endpoint Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const filePath = path.join(__dirname, 'json', 'user.data');

    if (!fs.existsSync(filePath)) {
        return res.status(400).json({ success: false, message: 'Belum ada akun yang terdaftar.' });
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileData);

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        res.json({ 
            success: true, 
            message: 'Login berhasil!', 
            user: { name: user.name, email: user.email, role: user.role } 
        });
    } else {
        res.status(401).json({ success: false, message: 'Email atau password salah!' });
    }
});

app.listen(3000, () => {
    console.log('Server PawCare berjalan di http://localhost:3000');
});