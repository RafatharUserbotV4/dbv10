require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const FILE_PATH = process.env.FILE_PATH;
const PASSWORD = process.env.PASSWORD; // Password untuk akses database

// Verifikasi password middleware
const verifyPassword = (req, res, next) => {
    const providedPassword = req.body.password;
    if (providedPassword !== PASSWORD) {
        return res.status(401).json({ error: 'Password salah. Hubungi developer.' });
    }
    next();
};

// Endpoint untuk menambahkan nomor
app.post('/add', verifyPassword, async (req, res) => {
    const newNumber = req.body.number;
    if (!newNumber) {
        return res.status(400).json({ error: 'Nomor diperlukan' });
    }

    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const content = Buffer.from(response.data.content, 'base64').toString();
        let jsonData = JSON.parse(content);

        if (!jsonData.dbny.includes(newNumber)) {
            jsonData.dbny.push(newNumber);
            const updatedContent = Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64');

            await axios.put(apiUrl, {
                message: `Menambahkan nomor ${newNumber}`,
                content: updatedContent,
                sha: response.data.sha
            }, {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });

            res.json({ success: true, message: `✅ Nomor ${newNumber} berhasil ditambahkan!` });
        } else {
            res.json({ success: false, message: `⚠️ Nomor ${newNumber} sudah ada!` });
        }
    } catch (error) {
        console.error('Gagal menambahkan:', error.message);
        res.status(500).json({ error: 'Gagal menambahkan nomor' });
    }
});

// Endpoint untuk menghapus nomor
app.post('/del', verifyPassword, async (req, res) => {
    const targetNumber = req.body.number;
    if (!targetNumber) {
        return res.status(400).json({ error: 'Nomor diperlukan' });
    }

    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const content = Buffer.from(response.data.content, 'base64').toString();
        let jsonData = JSON.parse(content);

        if (jsonData.dbny.includes(targetNumber)) {
            jsonData.dbny = jsonData.dbny.filter(num => num !== targetNumber);
            const updatedContent = Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64');

            await axios.put(apiUrl, {
                message: `Menghapus nomor ${targetNumber}`,
                content: updatedContent,
                sha: response.data.sha
            }, {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });

            res.json({ success: true, message: `✅ Nomor ${targetNumber} berhasil dihapus!` });
        } else {
            res.json({ success: false, message: `⚠️ Nomor ${targetNumber} tidak ditemukan!` });
        }
    } catch (error) {
        console.error('Gagal menghapus:', error.message);
        res.status(500).json({ error: 'Gagal menghapus nomor' });
    }
});

// Endpoint untuk melihat daftar database
app.get('/list', verifyPassword, async (req, res) => {
    // Karena middleware verifyPassword membutuhkan body, untuk GET kita bisa kirim password lewat query? 
    // Tapi tidak aman. Alternatif: ubah jadi POST atau gunakan header.
    // Kita ubah middleware untuk GET dengan mengambil dari query? Atau kita buat khusus untuk GET tanpa middleware dan lakukan pengecekan manual?
    // Kita ubah endpoint ini menjadi POST juga agar konsisten.

    // Karena sebelumnya kita pakai middleware yang butuh body, maka kita ubah endpoint ini menjadi POST.
    // Tapi untuk keseragaman, kita ganti dengan POST.
});

// Kita ubah endpoint list menjadi POST
app.post('/list', verifyPassword, async (req, res) => {
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const content = Buffer.from(response.data.content, 'base64').toString();
        let jsonData = JSON.parse(content);

        if (!jsonData.dbny || jsonData.dbny.length === 0) {
            return res.json({ message: '📂 Database kosong.' });
        }

        res.json({ list: jsonData.dbny });
    } catch (error) {
        console.error('Gagal mengambil database:', error.message);
        res.status(500).json({ error: 'Gagal mengambil database' });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});