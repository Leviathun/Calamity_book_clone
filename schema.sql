-- CREATE DATABASE IF NOT EXISTS ca_book;
-- USE ca_book;

-- 1. Users & Login Info (Combined into one table for simplicity)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 Staff / Admins
CREATE TABLE IF NOT EXISTS staff (
    admin_id VARCHAR(50) PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Address Book
CREATE TABLE IF NOT EXISTS address_book (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Category
CREATE TABLE IF NOT EXISTS category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_type VARCHAR(255) NOT NULL,
    img_url VARCHAR(255)
);

-- 3.5 Promotion Groups
CREATE TABLE IF NOT EXISTS promotion_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    duration_hours DECIMAL(5,2) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NOT NULL,
    is_active TINYINT DEFAULT 1
);

-- 4. Product
CREATE TABLE IF NOT EXISTS product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INT,
    category_type VARCHAR(255), -- Kept for compatibility with old code
    img_url VARCHAR(255),
    img_link VARCHAR(255), -- Added to support EJS inconsistency
    percent INT DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    price_discount DECIMAL(10,2),
    quantity INT DEFAULT 0,
    public_date DATE,
    star DECIMAL(3,1) DEFAULT 0.0,
    secondary_category VARCHAR(255) DEFAULT NULL, -- Added to support Promotion, Bestseller, Highlight tags
    promo_group_id INT DEFAULT NULL, -- Added to support group promotions
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL,
    FOREIGN KEY (promo_group_id) REFERENCES promotion_groups(group_id) ON DELETE SET NULL
);

-- 5. Shopping Cart
CREATE TABLE IF NOT EXISTS shopping_cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- 6. Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- 7. Orders
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 8. Order Items (Replaces bill_summary / testbook)
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- INSERT DUMMY DATA FOR TESTING
INSERT INTO category (category_type, img_url) VALUES 
('Fiction', 'https://picsum.photos/seed/cat1/200/300'),
('Comics', 'https://picsum.photos/seed/cat2/200/300'),
('Fantasy', 'https://picsum.photos/seed/cat3/200/300'),
('Science', 'https://picsum.photos/seed/cat4/200/300');

INSERT INTO product (product_name, category_type, category_id, img_url, img_link, percent, price, price_discount, quantity, public_date, star, secondary_category) VALUES 
('The Great Gatsby', 'Fiction', 1, 'https://picsum.photos/seed/bk1/200/300', 'https://picsum.photos/seed/bk1/200/300', 10, 500.00, 450.00, 50, '2023-01-01', 4.5, 'Promotion'),
('1984', 'Fiction', 1, 'https://picsum.photos/seed/bk2/200/300', 'https://picsum.photos/seed/bk2/200/300', 0, 350.00, 350.00, 30, '2023-02-15', 4.8, 'Bestseller'),
('To Kill a Mockingbird', 'Fiction', 1, 'https://picsum.photos/seed/bk3/200/300', 'https://picsum.photos/seed/bk3/200/300', 5, 400.00, 380.00, 20, '2023-03-10', 4.9, 'Bestseller'),
('Batman: Year One', 'Comics', 2, 'https://picsum.photos/seed/bk4/200/300', 'https://picsum.photos/seed/bk4/200/300', 0, 300.00, 300.00, 100, '2024-07-01', 5.0, 'Coming Soon'),
('Spider-Man: Blue', 'Comics', 2, 'https://picsum.photos/seed/bk5/200/300', 'https://picsum.photos/seed/bk5/200/300', 15, 250.00, 212.50, 80, '2024-05-12', 4.7, 'Promotion'),
('Watchmen', 'Comics', 2, 'https://picsum.photos/seed/bk6/200/300', 'https://picsum.photos/seed/bk6/200/300', 20, 600.00, 480.00, 15, '2022-11-20', 4.9, 'Promotion'),
('Harry Potter', 'Fantasy', 3, 'https://picsum.photos/seed/bk7/200/300', 'https://picsum.photos/seed/bk7/200/300', 0, 800.00, 800.00, 200, '2021-06-26', 4.9, 'Bestseller'),
('The Hobbit', 'Fantasy', 3, 'https://picsum.photos/seed/bk8/200/300', 'https://picsum.photos/seed/bk8/200/300', 10, 550.00, 495.00, 40, '2023-09-21', 4.8, 'Promotion'),
('The Lord of the Rings', 'Fantasy', 3, 'https://picsum.photos/seed/bk9/200/300', 'https://picsum.photos/seed/bk9/200/300', 0, 1200.00, 1200.00, 10, '2023-10-20', 5.0, 'Bestseller'),
('A Brief History of Time', 'Science', 4, 'https://picsum.photos/seed/bk10/200/300', 'https://picsum.photos/seed/bk10/200/300', 5, 450.00, 427.50, 60, '2022-04-01', 4.7, 'Promotion'),
('The Selfish Gene', 'Science', 4, 'https://picsum.photos/seed/bk11/200/300', 'https://picsum.photos/seed/bk11/200/300', 0, 380.00, 380.00, 25, '2022-05-15', 4.6, 'Highlight'),
('Sapiens', 'Science', 4, 'https://picsum.photos/seed/bk12/200/300', 'https://picsum.photos/seed/bk12/200/300', 25, 650.00, 487.50, 150, '2024-01-10', 4.8, 'Promotion');
