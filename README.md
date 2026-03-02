# TripWise Travel Platform

A beautiful, fully-featured travel agency platform that provides tour bookings, blog posts, an admin dashboard, and content management.

## 🌟 Features

- **Tours & Bookings**: Browse available tours and book them easily.
- **Admin Dashboard**: A comprehensive admin dashboard to manage users, tours, blogs, and messages.
- **Content Management**: Create, update, and delete tours and blog posts seamlessly.
- **Authentication**: Secure JWT-based authentication for admins and users.
- **Responsive Design**: Flawlessly optimized for all screen sizes (desktop, tablet, and mobile).

## 🛠️ Tech Stack

**Frontend:**
- HTML5
- CSS3 (Vanilla)
- Vanilla JavaScript (ES6+)
- Ionicons for iconography
- Google Fonts (Abril Fatface, Comforter Brush, Heebo)

**Backend:**
- Node.js
- Express.js
- JSON files for data storage (Tours, Blogs, Users, Messages)
- bcryptjs (for password hashing)
- jsonwebtoken (for secure API authentication)

## 📁 Project Structure

- `index.html` - The landing page and main overview.
- `tours.html` / `tour.html` - View all available tours and individual tour details.
- `blog.html` / `blog-post.html` - Browse the travel blog.
- `contact.html` - Get in touch via the contact form.
- `auth.html` - Login/Signup page for secure authentication.
- `admin.html` / `dashboard.html` - The fully featured admin area to manage platform data.
- `server/` - Node.js Express backend serving the RESTful API and managing authentication.
- `assets/` - Contains all custom styles (`style.css`), logic (`script.js`, `api.js`), and images.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Running Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NaitikAgrawal043/Travel-Website.git
   cd Travel-Website
   ```

2. **Navigate to the server directory and install dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:3000` by default. Note: You might need to configure environment variables depending on the authentication configuration.*

4. **Run the frontend:**
   Simply open `index.html` in your web browser, or use an extension like **Live Server** in VS Code.

## 🎨 Style Guide

TripWise adheres to a unified style guide to keep appearances consistent:

- **Primary Colors:** Viridian Green (`hsl(180, 98%, 31%)`), Mikado Yellow (`hsl(47, 98%, 50%)`)
- **Typography:** Abril Fatface (Headings), Comforter Brush (Accents), Heebo (Body)
- **Transitions:** Standardized easing functions for clean animations.

View `style-guide.md` for full implementation details.

## 📝 License
This project is licensed under the MIT License.
