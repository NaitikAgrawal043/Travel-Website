const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { generateId, now, paginate } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// POST /api/contact — Submit a contact message
router.post('/', (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        const contact = {
            id: generateId(),
            name,
            email,
            subject: subject || 'General Inquiry',
            message,
            status: 'unread',
            createdAt: now()
        };

        db.addItem('contacts.json', contact);
        res.status(201).json({ message: 'Thank you! Your message has been sent. We\'ll get back to you soon.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// GET /api/contact — Get all messages (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        let contacts = db.readData('contacts.json');
        const { status, page, limit } = req.query;

        if (status) {
            contacts = contacts.filter(c => c.status === status);
        }

        contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const result = paginate(contacts, parseInt(page) || 1, parseInt(limit) || 20);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

// PUT /api/contact/:id/read — Mark message as read (Admin only)
router.put('/:id/read', authenticateToken, requireAdmin, (req, res) => {
    try {
        const updated = db.updateItem('contacts.json', req.params.id, { status: 'read' });
        if (!updated) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        res.json({ message: 'Message marked as read.', contact: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update message.' });
    }
});

// DELETE /api/contact/:id — Delete message (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const deleted = db.deleteItem('contacts.json', req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        res.json({ message: 'Message deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete message.' });
    }
});

module.exports = router;
