const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root (where index.html lives)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// API health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'TripWise API is running!', timestamp: new Date().toISOString() });
});

// Seed admin user with proper hashed password on first run
async function seedAdmin() {
    const db = require('./utils/db');
    const users = db.readData('users.json');
    const admin = users.find(u => u.email === 'admin@tripwise.com');

    if (admin && admin.password === '$2a$10$dummyhashforseeding') {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        db.updateItem('users.json', admin.id, { password: hashedPassword });
        console.log('✅ Admin password has been set. Login: admin@tripwise.com / admin123');
    }
}

// SPA fallback — serve index.html for any non-API, non-file route
app.get('*', (req, res) => {
    // If it's a file request (has extension), let express.static handle 404
    if (path.extname(req.path)) {
        return res.status(404).send('File not found');
    }
    // Otherwise serve the requested HTML file or index.html
    const htmlFile = path.join(__dirname, '..', req.path.endsWith('.html') ? req.path : req.path + '.html');
    res.sendFile(htmlFile, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, '..', 'index.html'));
        }
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🌍 TripWise Server is Running!         ║
  ║                                          ║
  ║   Local:  http://localhost:${PORT}          ║
  ║   API:    http://localhost:${PORT}/api      ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);
    await seedAdmin();
});
