const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../utils/db');
const { generateId, now } = require('../utils/helpers');
const { generateToken, authenticateToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const existing = db.findByField('users.json', 'email', email);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = {
            id: generateId(),
            name,
            email,
            password: hashedPassword,
            role: 'user',
            createdAt: now()
        };

        db.addItem('users.json', user);

        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = db.findByField('users.json', 'email', email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful!',
            token,
            user: userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    const user = db.findById('users.json', req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
});

module.exports = router;
