# 📚 Calamity Book Store

A full-stack online bookstore web application built with **Node.js**, **Express**, **MySQL**, and **EJS**. Features a complete e-commerce experience including product browsing, shopping cart, wishlist, order management, and a powerful admin dashboard.

> 🌐 **Live Demo:** [https://calamity-book-project.onrender.com](https://calamity-book-project.onrender.com)

---

## ✨ Features

### 🛒 Customer Side
- **Browse & Search** — Filter books by category, search by name, and sort with tag-based navigation (Promotion, Bestseller, New Release, Highlight, Coming Soon)
- **Product Details** — View book details, pricing, discount info, and star ratings
- **Shopping Cart** — Add/remove items, adjust quantities, and proceed to checkout
- **Wishlist** — Save favorite books for later
- **Order Management** — Track orders with detailed order history and status
- **User Authentication** — Register, login, and manage account information with secure password hashing (bcrypt)
- **Address Book** — Save and manage delivery addresses
- **Google Maps Integration** — Interactive store location map on the Contact page

### 🔧 Admin Panel
- **Dashboard** — Overview with total income, order count, product stats, out-of-stock alerts, and bestseller rankings
- **Product Management** — Full CRUD operations (Create, Read, Update, Delete) with image upload support
- **Category Management** — Add and manage book categories dynamically
- **Promotion System** — Create time-limited group promotions with custom discount percentages and automatic expiration
- **Order History** — View and manage all customer orders with status updates

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Templating** | EJS (Embedded JavaScript) |
| **Database** | MySQL |
| **Authentication** | express-session, bcrypt |
| **File Upload** | Multer |
| **Frontend** | Bootstrap 5, Font Awesome, Google Fonts |
| **Maps** | Google Maps JavaScript API |
| **Deployment** | Render (Web Service) + Clever Cloud (MySQL) |

---

## 📂 Project Structure

```
Calamity_book_clone/
├── server.js              # Main Express server (routes, middleware, DB logic)
├── schema.sql             # Database schema & seed data
├── package.json           # Dependencies and scripts
├── public/
│   ├── imgAssets/          # Logo, icons, and static images
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   └── uploads/           # User-uploaded product images
└── views/
    ├── layout.ejs          # Main layout wrapper
    ├── templates/          # Reusable components (navbar, footer)
    ├── user/               # Customer-facing pages
    │   ├── home.ejs        # Homepage with carousel & featured books
    │   ├── all_category.ejs # Book browsing & filtering
    │   ├── product_page.ejs # Individual product detail
    │   ├── cart_page.ejs   # Shopping cart
    │   ├── payment.ejs     # Checkout & payment
    │   ├── my_order.ejs    # Order history
    │   ├── login.ejs       # User login
    │   ├── registration.ejs # User registration
    │   ├── account_info.ejs # Account settings
    │   ├── about_us.ejs    # About page
    │   └── contact.ejs     # Contact with Google Maps
    └── admin/              # Admin panel pages
        ├── staff_login.ejs # Admin login
        ├── dashboard.ejs   # Analytics dashboard
        ├── manage_product.ejs # Product & category CRUD
        ├── promotions.ejs  # Promotion management
        └── history.ejs     # Order management
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MySQL](https://www.mysql.com/) (v8.0+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Leviathun/Calamity_book_clone.git
   cd Calamity_book_clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a MySQL database named `ca_book`
   - Import the schema and seed data:
     ```bash
     mysql -u root -p ca_book < schema.sql
     ```

4. **Configure environment** (optional)
   
   The app uses environment variables with local fallbacks. For deployment, set:
   ```env
   DB_HOST=your_db_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=your_db_name
   DB_PORT=3306
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

### Default Admin Credentials
| Field | Value |
|-------|-------|
| Admin ID | `123456` |
| Password | `123456` |

Access the admin panel at `/admin`

---

## 🗄️ Database Schema

The application uses **10 tables**:

```
users ──┬── address_book
        ├── shopping_cart ──── product ──── category
        ├── wishlist ─────────┘    │
        └── orders                 └── promotion_groups
             └── order_items
             
staff (independent admin table)
```

---

## 🌐 Deployment

This project is deployed using:

- **[Render](https://render.com)** — Node.js web service hosting
- **[Clever Cloud](https://www.clever-cloud.com)** — Managed MySQL database

---

## 👥 Team

**Calamity** — SE Project 234, 2023

---

## 📄 License

This project is licensed under the ISC License.
