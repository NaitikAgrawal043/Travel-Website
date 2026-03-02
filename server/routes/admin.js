const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const users = db.readData('users.json');
        const tours = db.readData('tours.json');
        const bookings = db.readData('bookings.json');
        const reviews = db.readData('reviews.json');
        const contacts = db.readData('contacts.json');

        const totalRevenue = bookings
            .filter(b => b.paymentStatus === 'paid')
            .reduce((sum, b) => sum + b.totalPrice, 0);

        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

        const pendingReviews = reviews.filter(r => r.status === 'pending').length;
        const unreadMessages = contacts.filter(c => c.status === 'unread').length;

        // Popular tours (by booking count)
        const tourBookingCount = {};
        bookings.forEach(b => {
            tourBookingCount[b.tourId] = (tourBookingCount[b.tourId] || 0) + 1;
        });
        const popularTours = tours
            .map(t => ({ ...t, bookingCount: tourBookingCount[t.id] || 0 }))
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 5);

        // Recent bookings
        const recentBookings = bookings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Monthly revenue (last 6 months)
        const monthlyRevenue = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7);
            monthlyRevenue[key] = 0;
        }
        bookings.filter(b => b.paymentStatus === 'paid').forEach(b => {
            const key = b.createdAt.slice(0, 7);
            if (monthlyRevenue.hasOwnProperty(key)) {
                monthlyRevenue[key] += b.totalPrice;
            }
        });

        res.json({
            overview: {
                totalUsers: users.length,
                totalTours: tours.length,
                totalBookings: bookings.length,
                totalRevenue,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,
                pendingReviews,
                unreadMessages
            },
            popularTours,
            recentBookings,
            monthlyRevenue
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin stats.' });
    }
});

// GET /api/admin/users — List all users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    try {
        const users = db.readData('users.json').map(u => {
            const { password, ...safe } = u;
            return safe;
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// PUT /api/admin/users/:id/role — Update user role
router.put('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Role must be user or admin.' });
        }

        const updated = db.updateItem('users.json', req.params.id, { role });
        if (!updated) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const { password, ...safe } = updated;
        res.json({ message: `User role updated to ${role}.`, user: safe });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user role.' });
    }
});

module.exports = router;
