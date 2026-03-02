const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { generateId, now, paginate } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/tours — List all tours with search, filter, sort, pagination
router.get('/', (req, res) => {
    try {
        let tours = db.readData('tours.json');
        const { search, location, country, minPrice, maxPrice, duration, difficulty, sort, page, limit, featured } = req.query;

        // Search by title or location
        if (search) {
            const q = search.toLowerCase();
            tours = tours.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q) ||
                t.country.toLowerCase().includes(q)
            );
        }

        // Filter by location
        if (location) {
            tours = tours.filter(t => t.location.toLowerCase() === location.toLowerCase());
        }

        // Filter by country
        if (country) {
            tours = tours.filter(t => t.country.toLowerCase() === country.toLowerCase());
        }

        // Filter by price range
        if (minPrice) {
            tours = tours.filter(t => t.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            tours = tours.filter(t => t.price <= parseFloat(maxPrice));
        }

        // Filter by duration (max days)
        if (duration) {
            tours = tours.filter(t => t.durationDays <= parseInt(duration));
        }

        // Filter by difficulty
        if (difficulty) {
            tours = tours.filter(t => t.difficulty.toLowerCase() === difficulty.toLowerCase());
        }

        // Filter featured only
        if (featured === 'true') {
            tours = tours.filter(t => t.featured);
        }

        // Sort
        if (sort) {
            switch (sort) {
                case 'price_asc': tours.sort((a, b) => a.price - b.price); break;
                case 'price_desc': tours.sort((a, b) => b.price - a.price); break;
                case 'rating': tours.sort((a, b) => b.rating - a.rating); break;
                case 'duration': tours.sort((a, b) => a.durationDays - b.durationDays); break;
                case 'newest': tours.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
                default: break;
            }
        }

        const result = paginate(tours, parseInt(page) || 1, parseInt(limit) || 10);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tours.' });
    }
});

// GET /api/tours/:idOrSlug — Get single tour
router.get('/:idOrSlug', (req, res) => {
    try {
        const tours = db.readData('tours.json');
        const tour = tours.find(t => t.id === req.params.idOrSlug || t.slug === req.params.idOrSlug);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found.' });
        }

        // Get reviews for this tour
        const reviews = db.readData('reviews.json').filter(r => r.tourId === tour.id && r.status === 'approved');
        res.json({ ...tour, reviews });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tour.' });
    }
});

// POST /api/tours — Create tour (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { title, slug, price, duration, durationDays, location, country, description, image, highlights, included, notIncluded, maxGroupSize, difficulty, featured } = req.body;

        if (!title || !price || !location) {
            return res.status(400).json({ error: 'Title, price, and location are required.' });
        }

        const tour = {
            id: generateId(),
            title,
            slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            price: parseFloat(price),
            duration: duration || '1 Day',
            durationDays: parseInt(durationDays) || 1,
            location,
            country: country || '',
            description: description || '',
            image: image || '',
            gallery: [],
            rating: 0,
            reviewCount: 0,
            featured: featured || false,
            highlights: highlights || [],
            included: included || [],
            notIncluded: notIncluded || [],
            maxGroupSize: parseInt(maxGroupSize) || 15,
            difficulty: difficulty || 'Easy',
            createdAt: now()
        };

        db.addItem('tours.json', tour);
        res.status(201).json({ message: 'Tour created successfully!', tour });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create tour.' });
    }
});

// PUT /api/tours/:id — Update tour (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const updated = db.updateItem('tours.json', req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Tour not found.' });
        }
        res.json({ message: 'Tour updated successfully!', tour: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update tour.' });
    }
});

// DELETE /api/tours/:id — Delete tour (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const deleted = db.deleteItem('tours.json', req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Tour not found.' });
        }
        res.json({ message: 'Tour deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete tour.' });
    }
});

module.exports = router;
