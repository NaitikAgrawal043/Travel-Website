const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { generateId, now, paginate } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// GET /api/blogs — List all blogs
router.get('/', (req, res) => {
    try {
        let blogs = db.readData('blogs.json');
        const { search, category, tag, page, limit, featured } = req.query;

        if (search) {
            const q = search.toLowerCase();
            blogs = blogs.filter(b =>
                b.title.toLowerCase().includes(q) ||
                b.excerpt.toLowerCase().includes(q)
            );
        }

        if (category) {
            blogs = blogs.filter(b => b.category.toLowerCase() === category.toLowerCase());
        }

        if (tag) {
            blogs = blogs.filter(b => b.tags && b.tags.includes(tag.toLowerCase()));
        }

        if (featured === 'true') {
            blogs = blogs.filter(b => b.featured);
        }

        blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const result = paginate(blogs, parseInt(page) || 1, parseInt(limit) || 10);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blogs.' });
    }
});

// GET /api/blogs/:idOrSlug — Get single blog
router.get('/:idOrSlug', (req, res) => {
    try {
        const blogs = db.readData('blogs.json');
        const blog = blogs.find(b => b.id === req.params.idOrSlug || b.slug === req.params.idOrSlug);
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blog.' });
    }
});

// POST /api/blogs — Create blog (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { title, slug, excerpt, content, image, author, category, tags, readTime, featured } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required.' });
        }

        const blog = {
            id: generateId(),
            title,
            slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            excerpt: excerpt || content.substring(0, 150) + '...',
            content,
            image: image || '',
            author: author || req.user.name,
            authorAvatar: './assets/images/author-avatar.png',
            authorTitle: 'Admin',
            date: now(),
            category: category || 'General',
            tags: tags || [],
            readTime: readTime || '5 min read',
            featured: featured || false,
            createdAt: now()
        };

        db.addItem('blogs.json', blog);
        res.status(201).json({ message: 'Blog created successfully!', blog });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create blog.' });
    }
});

// PUT /api/blogs/:id — Update blog (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const updated = db.updateItem('blogs.json', req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.json({ message: 'Blog updated successfully!', blog: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update blog.' });
    }
});

// DELETE /api/blogs/:id — Delete blog (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const deleted = db.deleteItem('blogs.json', req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.json({ message: 'Blog deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete blog.' });
    }
});

module.exports = router;
