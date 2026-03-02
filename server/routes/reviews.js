const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { generateId, now, paginate } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/reviews?tourId=xxx — Get reviews for a tour
router.get('/', (req, res) => {
    try {
        let reviews = db.readData('reviews.json');
        const { tourId, status, page, limit } = req.query;

        if (tourId) {
            reviews = reviews.filter(r => r.tourId === tourId);
        }

        // By default show only approved reviews (unless admin requests all)
        if (status) {
            reviews = reviews.filter(r => r.status === status);
        } else {
            reviews = reviews.filter(r => r.status === 'approved');
        }

        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const result = paginate(reviews, parseInt(page) || 1, parseInt(limit) || 20);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
});

// POST /api/reviews — Submit a review
router.post('/', authenticateToken, (req, res) => {
    try {
        const { tourId, rating, comment } = req.body;

        if (!tourId || !rating) {
            return res.status(400).json({ error: 'Tour ID and rating are required.' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const tour = db.findById('tours.json', tourId);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found.' });
        }

        // Check if user already reviewed this tour
        const existingReviews = db.readData('reviews.json');
        const alreadyReviewed = existingReviews.find(r => r.tourId === tourId && r.userId === req.user.id);
        if (alreadyReviewed) {
            return res.status(400).json({ error: 'You have already reviewed this tour.' });
        }

        const review = {
            id: generateId(),
            tourId,
            userId: req.user.id,
            userName: req.user.name,
            rating: parseInt(rating),
            comment: comment || '',
            status: 'pending',
            createdAt: now()
        };

        db.addItem('reviews.json', review);
        res.status(201).json({ message: 'Review submitted! It will be visible after approval.', review });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit review.' });
    }
});

// PUT /api/reviews/:id/moderate — Approve/reject review (Admin only)
router.put('/:id/moderate', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected.' });
        }

        const updated = db.updateItem('reviews.json', req.params.id, { status });
        if (!updated) {
            return res.status(404).json({ error: 'Review not found.' });
        }

        // If approved, update tour's average rating
        if (status === 'approved') {
            const reviews = db.readData('reviews.json').filter(r => r.tourId === updated.tourId && r.status === 'approved');
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            db.updateItem('tours.json', updated.tourId, {
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: reviews.length
            });
        }

        res.json({ message: `Review ${status}!`, review: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to moderate review.' });
    }
});

// DELETE /api/reviews/:id — Delete review (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const deleted = db.deleteItem('reviews.json', req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Review not found.' });
        }
        res.json({ message: 'Review deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete review.' });
    }
});

module.exports = router;
