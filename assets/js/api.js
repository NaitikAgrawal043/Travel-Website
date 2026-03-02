/**
 * TripWise API Client
 * Shared utility for all pages to communicate with the backend
 */

const API_BASE = '/api';

const TripWise = {
    // ── Auth helpers ──────────────────────────────
    getToken() {
        return localStorage.getItem('tw_token');
    },

    getUser() {
        const user = localStorage.getItem('tw_user');
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    logout() {
        localStorage.removeItem('tw_token');
        localStorage.removeItem('tw_user');
        window.location.href = '/index.html';
    },

    saveAuth(token, user) {
        localStorage.setItem('tw_token', token);
        localStorage.setItem('tw_user', JSON.stringify(user));
    },

    // ── Fetch wrapper ─────────────────────────────
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        };

        const token = this.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const res = await fetch(url, config);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            return data;
        } catch (err) {
            throw err;
        }
    },

    // ── Auth API ──────────────────────────────────
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        this.saveAuth(data.token, data.user);
        return data;
    },

    async register(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: { name, email, password }
        });
        this.saveAuth(data.token, data.user);
        return data;
    },

    async getProfile() {
        return this.request('/auth/me');
    },

    // ── Tours API ─────────────────────────────────
    async getTours(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/tours?${query}`);
    },

    async getTour(idOrSlug) {
        return this.request(`/tours/${idOrSlug}`);
    },

    async createTour(tour) {
        return this.request('/tours', { method: 'POST', body: tour });
    },

    async updateTour(id, tour) {
        return this.request(`/tours/${id}`, { method: 'PUT', body: tour });
    },

    async deleteTour(id) {
        return this.request(`/tours/${id}`, { method: 'DELETE' });
    },

    // ── Blogs API ─────────────────────────────────
    async getBlogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/blogs?${query}`);
    },

    async getBlog(idOrSlug) {
        return this.request(`/blogs/${idOrSlug}`);
    },

    async createBlog(blog) {
        return this.request('/blogs', { method: 'POST', body: blog });
    },

    async updateBlog(id, blog) {
        return this.request(`/blogs/${id}`, { method: 'PUT', body: blog });
    },

    async deleteBlog(id) {
        return this.request(`/blogs/${id}`, { method: 'DELETE' });
    },

    // ── Bookings API ──────────────────────────────
    async getBookings(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/bookings?${query}`);
    },

    async createBooking(booking) {
        return this.request('/bookings', { method: 'POST', body: booking });
    },

    async updateBookingStatus(id, status, paymentStatus) {
        return this.request(`/bookings/${id}/status`, {
            method: 'PUT',
            body: { status, paymentStatus }
        });
    },

    async cancelBooking(id) {
        return this.request(`/bookings/${id}`, { method: 'DELETE' });
    },

    // ── Reviews API ───────────────────────────────
    async getReviews(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reviews?${query}`);
    },

    async submitReview(tourId, rating, comment) {
        return this.request('/reviews', {
            method: 'POST',
            body: { tourId, rating, comment }
        });
    },

    async moderateReview(id, status) {
        return this.request(`/reviews/${id}/moderate`, {
            method: 'PUT',
            body: { status }
        });
    },

    // ── Contact API ───────────────────────────────
    async sendContact(data) {
        return this.request('/contact', { method: 'POST', body: data });
    },

    async getContacts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/contact?${query}`);
    },

    async markContactRead(id) {
        return this.request(`/contact/${id}/read`, { method: 'PUT' });
    },

    // ── Admin API ─────────────────────────────────
    async getAdminStats() {
        return this.request('/admin/stats');
    },

    async getUsers() {
        return this.request('/admin/users');
    },

    async updateUserRole(id, role) {
        return this.request(`/admin/users/${id}/role`, {
            method: 'PUT',
            body: { role }
        });
    },

    // ── UI Helpers ────────────────────────────────
    renderStars(rating, max = 5) {
        let html = '';
        for (let i = 1; i <= max; i++) {
            html += `<ion-icon name="${i <= rating ? 'star' : 'star-outline'}" aria-hidden="true"></ion-icon>`;
        }
        return html;
    },

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatPrice(amount) {
        return `$${parseFloat(amount).toFixed(2)}`;
    },

    showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.tw-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `tw-toast tw-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    updateNav() {
        const user = this.getUser();
        const navBookingBtn = document.querySelector('.navbar .btn-secondary');

        if (navBookingBtn) {
            if (user) {
                navBookingBtn.textContent = user.role === 'admin' ? 'Dashboard' : 'My Bookings';
                navBookingBtn.href = user.role === 'admin' ? '/admin.html' : '/dashboard.html';
            } else {
                navBookingBtn.textContent = 'Login / Register';
                navBookingBtn.href = '/auth.html';
            }
        }

        // Add logout link if logged in
        const navList = document.querySelector('.navbar-list');
        if (navList && user) {
            const existingLogout = navList.querySelector('.nav-logout');
            if (!existingLogout) {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="navbar-link nav-logout">Logout</a>`;
                li.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
                navList.appendChild(li);
            }
        }
    }
};

// Update nav on every page load
document.addEventListener('DOMContentLoaded', () => {
    TripWise.updateNav();
});
