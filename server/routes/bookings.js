const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { generateId, now, paginate } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/bookings — Get user's bookings (or all for admin)
router.get('/', authenticateToken, (req, res) => {
    try {
        let bookings = db.readData('bookings.json');

        if (req.user.role !== 'admin') {
            bookings = bookings.filter(b => b.userId === req.user.id);
        }

        // Enrich with tour info
        const tours = db.readData('tours.json');
        bookings = bookings.map(b => {
            const tour = tours.find(t => t.id === b.tourId);
            return { ...b, tour: tour ? { title: tour.title, image: tour.image, location: tour.location, country: tour.country } : null };
        });

        bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const { page, limit } = req.query;
        const result = paginate(bookings, parseInt(page) || 1, parseInt(limit) || 10);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
});

// POST /api/bookings — Create a booking
router.post('/', authenticateToken, (req, res) => {
    try {
        const { tourId, date, guests, specialRequests } = req.body;

        if (!tourId || !date || !guests) {
            return res.status(400).json({ error: 'Tour ID, date, and number of guests are required.' });
        }

        const tour = db.findById('tours.json', tourId);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found.' });
        }

        if (parseInt(guests) > tour.maxGroupSize) {
            return res.status(400).json({ error: `Maximum ${tour.maxGroupSize} guests allowed for this tour.` });
        }

        const booking = {
            id: generateId(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            tourId,
            tourTitle: tour.title,
            date,
            guests: parseInt(guests),
            totalPrice: tour.price * parseInt(guests),
            status: 'pending',
            paymentStatus: 'pending',
            specialRequests: specialRequests || '',
            createdAt: now()
        };

        db.addItem('bookings.json', booking);
        res.status(201).json({ message: 'Booking created successfully! We will confirm your booking shortly.', booking });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create booking.' });
    }
});

// PUT /api/bookings/:id/status — Update booking status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (paymentStatus) updates.paymentStatus = paymentStatus;

        const updated = db.updateItem('bookings.json', req.params.id, updates);
        if (!updated) {
            return res.status(404).json({ error: 'Booking not found.' });
        }
        res.json({ message: 'Booking status updated!', booking: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update booking.' });
    }
});

// DELETE /api/bookings/:id — Cancel booking
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const booking = db.findById('bookings.json', req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found.' });
        }

        // Only the user who made the booking or admin can cancel
        if (booking.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to cancel this booking.' });
        }

        const updated = db.updateItem('bookings.json', req.params.id, { status: 'cancelled' });
        res.json({ message: 'Booking cancelled successfully.', booking: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel booking.' });
    }
});

module.exports = router;
