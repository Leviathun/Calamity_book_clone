const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts'); 
const session = require('express-session');
const bcrypt = require('bcrypt');

const multer = require("multer");
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadFile = multer({ storage: storage });

app.use(bodyParser.json());

app.use(session({
    secret: 'calamity-book-secret',
    resave: false,
    saveUninitialized: false
}));

// middleware to pass user session to templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    next();
});

// Middleware to protect admin routes
function isAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    res.redirect('/staff-login');
}
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// access to css / photo file
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Tun-48449",
    database: "ca_book"
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');

    // Create staff table if not exists and seed default admin
    const createStaffTable = `
        CREATE TABLE IF NOT EXISTS staff (
            admin_id VARCHAR(50) PRIMARY KEY,
            admin_name VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createStaffTable, (errStaff) => {
        if (errStaff) {
            console.error('Error creating staff table:', errStaff);
        } else {
            const insertAdmin = `
                INSERT IGNORE INTO staff (admin_id, admin_name, password)
                VALUES ('123456', 'Administrator', '123456')
            `;
            db.query(insertAdmin, (errAdmin) => {
                if (errAdmin) console.error('Error inserting default admin:', errAdmin);
            });
        }
    });

    fetchProducts();
    fetchCategory();
    checkExpiredPromotions();
});

// Automated checker for expired promotions
function checkExpiredPromotions() {
    const now = new Date();
    db.query('SELECT * FROM promotion_groups WHERE is_active = 1 AND end_time <= ?', [now], (err, expiredGroups) => {
        if (err) {
            console.error('Error selecting expired promotions:', err);
            return;
        }
        if (expiredGroups && expiredGroups.length > 0) {
            expiredGroups.forEach(group => {
                console.log(`[PROMOTION EXPIRED] Resetting promotion group ID: ${group.group_id}`);
                db.query(
                    'UPDATE product SET percent = 0, price_discount = price, secondary_category = NULL, promo_group_id = NULL WHERE promo_group_id = ?',
                    [group.group_id],
                    (err2) => {
                        if (err2) console.error(`Error resetting products for group ${group.group_id}:`, err2);
                        
                        db.query(
                            'UPDATE promotion_groups SET is_active = 0 WHERE group_id = ?',
                            [group.group_id],
                            (err3) => {
                                if (err3) console.error(`Error deactivating group ${group.group_id}:`, err3);
                                fetchProducts(); // Sync EJS app.locals.products
                            }
                        );
                    }
                );
            });
        }
    });
}

// Check every 10 seconds
setInterval(checkExpiredPromotions, 10000);

// Function to fetch Allproducts
function fetchProducts() {
    db.query('SELECT * FROM product', (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return;
        }
        /*console.log('Products:', results);*/
        // Pass products to render
        app.locals.products = results;
    });
}

//render home page
app.get('/', (req, res) => {
    db.query('SELECT * FROM promotion_groups WHERE is_active = 1 AND end_time > NOW() ORDER BY end_time ASC LIMIT 1', (err, promoResults) => {
        const activePromoGroup = (promoResults && promoResults.length > 0) ? promoResults[0] : null;
        res.render('user/home', { product : app.locals.products, activePromoGroup });
    });
});

//add category
app.post('/book/add', (req, res) => {
    const {Category_Name,img_url  } = req.body;

    const sql = "INSERT INTO category (category_type,img_url) VALUES (?, ?)";
    const values = [Category_Name,img_url];

    console.log(values);
    db.query(sql, values, (error, results, fields) => {
        if (error) {
            console.error('Error inserting data into database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        console.log('Data inserted successfully:', results);

        res.redirect('/manage-product?tab=categories');
        
    });
});

// Function to fetch Category
function fetchCategory() {
    db.query('SELECT * FROM category', (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return;
        }
        console.log('category:', results);
        // Pass products to render
        app.locals.category = results;
    });
}


// Redirect legacy category/product routes to unified manage-product
app.get('/add-category', isAdmin, (req, res) => {
    res.redirect('/manage-product?tab=categories');
});

app.get('/manage-category', isAdmin, (req, res) => {
    res.redirect('/manage-product?tab=categories');
});

app.get('/edit-category', isAdmin, (req, res) => {
    res.redirect('/manage-product?tab=categories');
});

app.get('/add-product', isAdmin, (req, res) => {
    res.redirect('/manage-product');
});

app.get('/edit-product', isAdmin, (req, res) => {
    res.redirect('/manage-product');
});

// GET Product details by ID for Edit AJAX Modal
app.get('/admin/product/details/:id', isAdmin, (req, res) => {
    const productId = req.params.id;
    db.query('SELECT * FROM product WHERE product_id = ?', [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product details:', err);
            return res.status(500).json({ success: false, message: 'Database error fetching product details' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product: results[0] });
    });
});
//go to manage-product
app.get('/manage-product', isAdmin, (req, res) => {
    db.query('SELECT * FROM category', (err, categories) => {
        if (err) {
            console.error('Error fetching categories for manage-product:', err);
            categories = [];
        }
        res.render('admin/manage_product', { categories, layout: false });
    });
});

// GET Promotions Management View
app.get('/admin/promotions', isAdmin, (req, res) => {
    // 1) Fetch all products
    db.query('SELECT * FROM product', (err, products) => {
        if (err) products = [];
        
        // 2) Fetch active and past promotion groups
        db.query('SELECT * FROM promotion_groups ORDER BY start_time DESC', (err2, groups) => {
            if (err2) groups = [];
            
            res.render('admin/promotions', {
                products,
                groups,
                activeTab: 'promotions',
                layout: false
            });
        });
    });
});

// POST API to Create a Group Promotion
app.post('/admin/promotion/create-group', (req, res) => {
    const { groupName, durationHours, products } = req.body;
    
    if (!groupName || !durationHours || !products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid data. Group name, duration, and selected products are required.' });
    }

    const duration = parseFloat(durationHours);
    const endTime = new Date(Date.now() + duration * 60 * 60 * 1000);

    // 1) Insert group record
    const qInsertGroup = 'INSERT INTO promotion_groups (group_name, duration_hours, end_time, is_active) VALUES (?, ?, ?, 1)';
    db.query(qInsertGroup, [groupName, duration, endTime], (err, result) => {
        if (err) {
            console.error('Error inserting promotion group:', err);
            return res.status(500).json({ success: false, message: 'Database error creating promotion group.' });
        }
        
        const groupId = result.insertId;

        // 2) Link products and apply individual percentage discounts
        let completedCount = 0;
        let hasError = false;

        products.forEach(pItem => {
            const prodId = parseInt(pItem.id, 10);
            const percent = parseInt(pItem.percent, 10) || 0;

            // Fetch product standard base price
            db.query('SELECT price FROM product WHERE product_id = ?', [prodId], (err2, prodRes) => {
                if (err2 || prodRes.length === 0) {
                    hasError = true;
                    completedCount++;
                    checkDone();
                    return;
                }

                const basePrice = parseFloat(prodRes[0].price);
                const discountPrice = basePrice * (1 - percent / 100);

                const qUpdateProduct = `
                    UPDATE product 
                    SET percent = ?, price_discount = ?, secondary_category = 'Promotion', promo_group_id = ?
                    WHERE product_id = ?
                `;
                db.query(qUpdateProduct, [percent, discountPrice, groupId, prodId], (err3) => {
                    if (err3) {
                        hasError = true;
                    }
                    completedCount++;
                    checkDone();
                });
            });
        });

        function checkDone() {
            if (completedCount === products.length) {
                if (hasError) {
                    return res.status(500).json({ success: false, message: 'Promotion group was created, but some products failed to link correctly.' });
                }
                fetchProducts(); // Refresh globals
                res.json({ success: true, message: 'Group promotion created successfully and is now active!' });
            }
        }
    });
});

// GET products by category for management list (with dynamic sold quantities)
app.get('/get-products', (req, res) => {
    const { category } = req.query;
    if (!category) {
        return res.status(400).json({ error: 'Category is required' });
    }
    const qProducts = `
        SELECT p.product_id AS id, p.product_name AS name, p.price, p.price_discount, p.quantity, COALESCE(p.img_link, p.img_url) AS image,
               (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.product_id = p.product_id) AS saleCount
        FROM product p
        WHERE p.category_type = ?
    `;
    db.query(qProducts, [category], (err, results) => {
        if (err) {
            console.error('Error querying products by category:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Delete Product API
app.post('/admin/product/delete', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    db.query('DELETE FROM product WHERE product_id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ success: false, message: 'Database error deleting product' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    });
});

// Submit Add Product API (Multipart Form upload)
app.post('/submit-product', uploadFile.single('image'), (req, res) => {
    const productName = req.body['product-name'];
    const category = req.body.category;
    const quantity = req.body.quantity;
    const priceField = req.body.price || req.body['regular-price'];
    const secondaryCategory = req.body['secondary-category'] || null;
    const star = req.body.star ? parseFloat(req.body.star) : 5.0;
    const publicationDate = req.body['publication-date'];

    if (!productName || !priceField) {
        return res.status(400).json({ success: false, message: 'Product Name and Price are required.' });
    }

    // Look up category ID
    db.query('SELECT category_id FROM category WHERE category_type = ?', [category], (err, catRes) => {
        const categoryId = (catRes && catRes.length > 0) ? catRes[0].category_id : null;
        
        // Handle cover image
        let imgPath = '';
        if (req.file) {
            imgPath = '/uploads/' + req.file.filename;
        } else {
            imgPath = 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/200/300';
        }

        const price = parseFloat(priceField);
        const percent = 0;
        const priceDiscount = price;
        const qty = parseInt(quantity, 10) || 0;
        const pubDate = publicationDate ? publicationDate : null;

        const qInsert = `
            INSERT INTO product (product_name, category_id, category_type, img_url, img_link, percent, price, price_discount, quantity, public_date, star, secondary_category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [productName, categoryId, category, imgPath, imgPath, percent, price, priceDiscount, qty, pubDate, star, secondaryCategory];

        db.query(qInsert, params, (err2, results) => {
            if (err2) {
                console.error('Error inserting product in DB:', err2);
                return res.status(500).json({ success: false, message: 'Database error adding product.' });
            }
            // Fetch updated list of products to keep app.locals.products synced
            fetchProducts();
            res.json({ success: true, message: 'Product added successfully!' });
        });
    });
});

// Edit Product API (Multipart Form upload)
app.post('/admin/product/edit/:id', uploadFile.single('image'), (req, res) => {
    const productId = req.params.id;
    const productName = req.body['product-name'];
    const category = req.body.category;
    const quantity = req.body.quantity;
    const priceField = req.body.price || req.body['regular-price'];
    const secondaryCategory = req.body['secondary-category'] || null;
    const star = req.body.star ? parseFloat(req.body.star) : 5.0;
    const publicationDate = req.body['publication-date'];

    if (!productName || !priceField) {
        return res.status(400).json({ success: false, message: 'Product Name and Price are required.' });
    }

    db.query('SELECT category_id FROM category WHERE category_type = ?', [category], (err, catRes) => {
        const categoryId = (catRes && catRes.length > 0) ? catRes[0].category_id : null;
        const price = parseFloat(priceField);
        const qty = parseInt(quantity, 10) || 0;
        const pubDate = publicationDate ? publicationDate : null;

        // Fetch existing percent and secondary_category to handle active promotions gracefully
        db.query('SELECT percent, secondary_category FROM product WHERE product_id = ?', [productId], (err3, prodCheck) => {
            let percent = 0;
            let priceDiscount = price;

            if (prodCheck && prodCheck.length > 0) {
                const currentSecCat = prodCheck[0].secondary_category;
                // If it remains a Promotion, preserve the percentage discount and recalculate priceDiscount based on new base price
                if (secondaryCategory === 'Promotion' || (!secondaryCategory && currentSecCat === 'Promotion')) {
                    percent = prodCheck[0].percent || 0;
                    priceDiscount = price * (1 - percent / 100);
                }
            }

            if (req.file) {
                // New image uploaded
                const imgPath = '/uploads/' + req.file.filename;
                const qUpdate = `
                    UPDATE product 
                    SET product_name = ?, category_id = ?, category_type = ?, img_url = ?, img_link = ?, percent = ?, price = ?, price_discount = ?, quantity = ?, public_date = ?, star = ?, secondary_category = ?
                    WHERE product_id = ?
                `;
                const params = [productName, categoryId, category, imgPath, imgPath, percent, price, priceDiscount, qty, pubDate, star, secondaryCategory, productId];
                db.query(qUpdate, params, (err2, results) => {
                    if (err2) {
                        console.error('Error updating product (with image):', err2);
                        return res.status(500).json({ success: false, message: 'Database error editing product.' });
                    }
                    fetchProducts();
                    res.json({ success: true, message: 'Product updated successfully!' });
                });
            } else {
                // Keep old cover image
                const qUpdate = `
                    UPDATE product 
                    SET product_name = ?, category_id = ?, category_type = ?, percent = ?, price = ?, price_discount = ?, quantity = ?, public_date = ?, star = ?, secondary_category = ?
                    WHERE product_id = ?
                `;
                const params = [productName, categoryId, category, percent, price, priceDiscount, qty, pubDate, star, secondaryCategory, productId];
                db.query(qUpdate, params, (err2, results) => {
                    if (err2) {
                        console.error('Error updating product (without image):', err2);
                        return res.status(500).json({ success: false, message: 'Database error editing product.' });
                    }
                    fetchProducts();
                    res.json({ success: true, message: 'Product updated successfully!' });
                });
            }
        });
    });
});

//go to top-product
app.get('/top-product', isAdmin, (req, res) => {
    res.render('admin/top_product', { layout: false });
});

//go to bill-summary
app.get('/bill-summary', isAdmin, (req, res) => {
    res.render('admin/bill_summary', { layout: false });
});

//go to staff-login
app.get('/staff-login', (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect('/dashboard');
    }
    res.render('admin/staff_login', { layout: false });
});

// POST to authenticate admin/staff
app.post('/staff-login', (req, res) => {
    const { adminID, password } = req.body;

    if (!adminID || !password) {
        return res.render('admin/staff_login', { error: 'Please enter both Admin ID and Password', layout: false });
    }

    db.query('SELECT * FROM staff WHERE admin_id = ? AND password = ?', [adminID, password], (err, results) => {
        if (err) {
            console.error('Database error during staff login:', err);
            return res.render('admin/staff_login', { error: 'Database error. Please try again.', layout: false });
        }

        if (results.length === 0) {
            return res.render('admin/staff_login', { error: 'Invalid Admin ID or Password', layout: false });
        }

        // Login success! Set session
        req.session.admin = results[0];
        res.redirect('/dashboard');
    });
});

//go to staff-product-dashboard
app.get('/dashboard', isAdmin, (req, res) => {
    const qIncome = "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE status != 'Returned' AND status != 'Cancelled'";
    const qOrders = "SELECT COUNT(*) AS total FROM orders";
    const qProducts = "SELECT COUNT(*) AS total FROM product";
    const qOutOfStock = "SELECT COUNT(*) AS total FROM product WHERE quantity = 0";
    
    // Top 5 best sellers based on sold quantity
    const qBestSellers = `
        SELECT p.product_id, p.product_name, p.price, p.price_discount, p.img_link, p.img_url, p.category_type, 
               COALESCE(SUM(oi.quantity), 0) AS saleCount,
               COALESCE(MIN(oi.price), p.price_discount, p.price) AS actualSoldPrice
        FROM product p
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        GROUP BY p.product_id
        ORDER BY saleCount DESC
        LIMIT 5
    `;

    db.query(qIncome, (err, incomeRes) => {
        db.query(qOrders, (err2, ordersRes) => {
            db.query(qProducts, (err3, productsRes) => {
                db.query(qOutOfStock, (err4, outOfStockRes) => {
                    db.query(qBestSellers, (err5, bestSellersRes) => {
                        if (err || err2 || err3 || err4 || err5) {
                            console.error('Error loading dashboard stats:', { err, err2, err3, err4, err5 });
                            return res.status(500).send('Internal Server Error loading dashboard');
                        }
                        
                        const stats = {
                            income: incomeRes[0].total,
                            orders: ordersRes[0].total,
                            products: productsRes[0].total,
                            outOfStock: outOfStockRes[0].total
                        };
                        
                        res.render('admin/dashboard', {
                            stats,
                            bestSellers: bestSellersRes,
                            layout: false
                        });
                    });
                });
            });
        });
    });
});

// admin sales and order history page
app.get('/admin/history', isAdmin, (req, res) => {
    const qOrders = `
        SELECT o.*, u.name AS customer_name, u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC
    `;
    db.query(qOrders, (err, orders) => {
        if (err) {
            console.error('Error loading history orders:', err);
            return res.status(500).send('Internal Server Error loading history');
        }
        
        const qItems = `
            SELECT oi.*, p.product_name, p.img_link, p.img_url, p.price AS original_price
            FROM order_items oi
            JOIN product p ON oi.product_id = p.product_id
        `;
        db.query(qItems, (err2, items) => {
            if (err2) {
                console.error('Error loading history order items:', err2);
                return res.status(500).send('Internal Server Error loading history');
            }
            
            // Map items to their respective orders
            const ordersWithItems = orders.map(order => {
                order.items = items.filter(item => item.order_id === order.order_id);
                return order;
            });

            // Calculate total realized revenue (exclude Returned/Cancelled)
            let totalRevenue = 0;
            orders.forEach(order => {
                if (order.status !== 'Returned' && order.status !== 'Cancelled') {
                    totalRevenue += Number(order.total_price);
                }
            });

            res.render('admin/history', {
                orders: ordersWithItems,
                totalRevenue,
                activeTab: 'history',
                layout: false
            });
        });
    });
});

//go to staff-product-product
app.get('/staff-product', isAdmin, (req, res) => {
    res.redirect('/manage-product');
});


//go to my-order (consolidated: orders + wishlist + history)
app.get('/my-order', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const userId = req.session.user.id;

    // 1) Recent 5 orders with first item image
    const recentSQL = `
        SELECT o.*, 
               (SELECT p.product_name FROM order_items oi JOIN product p ON oi.product_id = p.product_id WHERE oi.order_id = o.order_id LIMIT 1) as product_name,
               (SELECT p.img_link FROM order_items oi JOIN product p ON oi.product_id = p.product_id WHERE oi.order_id = o.order_id LIMIT 1) as img_link
        FROM orders o WHERE o.user_id = ? ORDER BY o.order_date DESC LIMIT 5
    `;
    // 2) All orders with item count
    const allSQL = `
        SELECT o.*, COUNT(oi.order_item_id) as item_count
        FROM orders o LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = ? GROUP BY o.order_id ORDER BY o.order_date DESC
    `;
    // 3) Wishlist
    const wishSQL = `
        SELECT w.wishlist_id, p.product_id, p.product_name, p.price, p.price_discount, p.img_link
        FROM wishlist w JOIN product p ON w.product_id = p.product_id
        WHERE w.user_id = ?
    `;

    db.query(recentSQL, [userId], (e1, recentOrders) => {
        db.query(allSQL, [userId], (e2, allOrders) => {
            db.query(wishSQL, [userId], (e3, wishlistItems) => {
                res.render('user/my_order', {
                    recentOrders: recentOrders || [],
                    allOrders: allOrders || [],
                    wishlistItems: wishlistItems || []
                });
            });
        });
    });
});

// GET order details page
app.get('/order-details', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const orderId = req.query.id;
    if (!orderId) return res.redirect('/my-order');
    
    const userId = req.session.user.id;

    // Verify order belongs to user
    db.query('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', [orderId, userId], (err, orderRes) => {
        if (err || orderRes.length === 0) return res.redirect('/my-order');
        
        const order = orderRes[0];

        // Get items
        const itemsQuery = `
            SELECT oi.quantity, oi.price, p.product_name, p.img_link, p.product_id
            FROM order_items oi
            JOIN product p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `;
        db.query(itemsQuery, [orderId], (err2, items) => {
            if (err2) return res.redirect('/my-order');

            // Get user's address
            db.query('SELECT * FROM address_book WHERE user_id = ? LIMIT 1', [userId], (err3, addrRes) => {
                const address = (addrRes && addrRes.length > 0) ? addrRes[0] : null;

                res.render('user/order_details', {
                    order,
                    items,
                    address
                });
            });
        });
    });
});

//go to my-wishlist (redirect to my-order now)
app.get('/wishlist', (req, res) => {
    res.redirect('/my-order');
});

// Remove from wishlist
app.post('/wishlist/remove', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { wishlist_id, product_id } = req.body;
    
    if (product_id) {
        db.query('DELETE FROM wishlist WHERE product_id = ? AND user_id = ?', [product_id, req.session.user.id], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Database error' });
            res.json({ success: true, message: 'Removed from wishlist' });
        });
    } else {
        db.query('DELETE FROM wishlist WHERE wishlist_id = ? AND user_id = ?', [wishlist_id, req.session.user.id], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Database error' });
            res.json({ success: true, message: 'Removed from wishlist' });
        });
    }
});

// ========== PAYMENT ROUTES ==========
// GET payment page
app.get('/payment', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const userId = req.session.user.id;
    const query = `
        SELECT c.cart_id, c.quantity, p.product_id, p.product_name, p.price, p.price_discount, p.img_link
        FROM shopping_cart c JOIN product p ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err || !results || results.length === 0) {
            return res.redirect('/cart');
        }
        let subtotal = 0;
        results.forEach(item => {
            subtotal += (item.price_discount || item.price) * item.quantity;
        });
        res.render('user/payment', { cartItems: results, subtotal });
    });
});

// POST process payment
app.post('/payment/process', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const userId = req.session.user.id;
    const { payment_method } = req.body; // 'credit_card' or 'cod'

    // Get cart items
    const cartQuery = `
        SELECT c.quantity, p.product_id, p.price, p.price_discount
        FROM shopping_cart c JOIN product p ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;
    db.query(cartQuery, [userId], (err, cartItems) => {
        if (err || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate total
        let total = 0;
        cartItems.forEach(item => {
            total += (item.price_discount || item.price) * item.quantity;
        });

        // Determine status based on payment method
        let status = 'Pending';
        if (payment_method === 'credit_card') {
            // Credit card = always Paid, then random shipping state
            const rand = Math.random();
            if (rand < 0.4) status = 'Paid';
            else if (rand < 0.7) status = 'Shipping';
            else if (rand < 0.9) status = 'Delivered';
            else status = 'Returned';
        }
        // COD = always Pending

        // Create order
        db.query(
            'INSERT INTO orders (user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?)',
            [userId, total, status, payment_method],
            (err2, orderResult) => {
                if (err2) return res.status(500).json({ success: false, message: 'Error creating order' });
                const orderId = orderResult.insertId;

                // Insert order items
                const itemValues = cartItems.map(item => [
                    orderId, item.product_id, item.quantity, (item.price_discount || item.price)
                ]);
                db.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
                    [itemValues],
                    (err3) => {
                        if (err3) return res.status(500).json({ success: false, message: 'Error saving order items' });

                        // Decrement stock for purchased products
                        const decrementStock = (index) => {
                            if (index >= cartItems.length) {
                                // Clear cart
                                db.query('DELETE FROM shopping_cart WHERE user_id = ?', [userId], (err4) => {
                                    // Update app.locals.products cache
                                    fetchProducts();
                                    res.json({ success: true, message: 'Payment successful!', orderId });
                                });
                                return;
                            }
                            const item = cartItems[index];
                            db.query(
                                'UPDATE product SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ?',
                                [item.quantity, item.product_id],
                                (errDec) => {
                                    if (errDec) {
                                        console.error('Error decrementing stock for product ID:', item.product_id, errDec);
                                    }
                                    decrementStock(index + 1);
                                }
                            );
                        };

                        decrementStock(0);
                    }
                );
            }
        );
    });
});

//go to about-us
app.get('/about_us', (req, res) => {
    res.render('user/about_us');
});

//go to account-info
app.get('/account-info', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const userId = req.session.user.id;
    db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, userResults) => {
        if (err || userResults.length === 0) {
            return res.render('user/account_info');
        }
        const userData = {
            id: userResults[0].user_id,
            name: userResults[0].name,
            email: userResults[0].email,
            phone: userResults[0].phone,
            created_at: userResults[0].created_at
        };
        res.locals.user = userData;

        // Also fetch address
        db.query('SELECT * FROM address_book WHERE user_id = ? LIMIT 1', [userId], (err2, addrResults) => {
            res.locals.address = (addrResults && addrResults.length > 0) ? addrResults[0] : null;
            res.render('user/account_info');
        });
    });
});

// Update profile + address
app.post('/account-info/update', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const userId = req.session.user.id;
    const { name, phone, address_line, city, zip_code } = req.body;

    // Update user info
    db.query('UPDATE users SET name = ?, phone = ? WHERE user_id = ?', [name, phone, userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error updating profile' });

        // Update session name
        req.session.user.name = name;

        // Upsert address
        if (address_line || city || zip_code) {
            db.query('SELECT * FROM address_book WHERE user_id = ?', [userId], (err2, addrResults) => {
                if (err2) return res.status(500).json({ success: false, message: 'Error checking address' });

                if (addrResults.length > 0) {
                    db.query('UPDATE address_book SET address_line = ?, city = ?, zip_code = ? WHERE user_id = ?',
                        [address_line, city, zip_code, userId], (err3) => {
                            if (err3) return res.status(500).json({ success: false, message: 'Error updating address' });
                            res.json({ success: true, message: 'Profile updated!' });
                        });
                } else {
                    db.query('INSERT INTO address_book (user_id, address_line, city, zip_code) VALUES (?, ?, ?, ?)',
                        [userId, address_line, city, zip_code], (err3) => {
                            if (err3) return res.status(500).json({ success: false, message: 'Error saving address' });
                            res.json({ success: true, message: 'Profile updated!' });
                        });
                }
            });
        } else {
            res.json({ success: true, message: 'Profile updated!' });
        }
    });
});

//go to all-books (with advanced dynamic filtering, search, and sorting)
app.get('/all-books', (req, res) => {
    const selectedCategory = req.query.category;
    const selectedTag = req.query.tag; // secondary category e.g., Promotion, Bestseller
    const searchQuery = req.query.search;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const sortBy = req.query.sortBy;

    let query = 'SELECT * FROM product WHERE 1=1';
    const params = [];

    if (selectedCategory && selectedCategory !== 'All category' && selectedCategory !== 'All Books') {
        query += ' AND category_type = ?';
        params.push(selectedCategory);
    }

    if (selectedTag) {
        query += ' AND secondary_category = ?';
        params.push(selectedTag);
    }

    if (searchQuery) {
        query += ' AND product_name LIKE ?';
        params.push(`%${searchQuery}%`);
    }

    if (minPrice) {
        query += ' AND COALESCE(price_discount, price) >= ?';
        params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
        query += ' AND COALESCE(price_discount, price) <= ?';
        params.push(parseFloat(maxPrice));
    }

    // Sorting
    if (sortBy === 'latest') {
        query += ' ORDER BY public_date DESC, product_id DESC';
    } else if (sortBy === 'price_asc') {
        query += ' ORDER BY COALESCE(price_discount, price) ASC';
    } else if (sortBy === 'price_desc') {
        query += ' ORDER BY COALESCE(price_discount, price) DESC';
    } else if (sortBy === 'rating') {
        query += ' ORDER BY star DESC';
    } else {
        // Default sort: latest
        query += ' ORDER BY product_id DESC';
    }

    db.query(query, params, (err, products) => {
        if (err) {
            console.error('Error fetching filtered products:', err);
            return res.render('user/all_category', { 
                products: [], 
                selectedCategory: selectedCategory || '',
                selectedTag: selectedTag || '',
                searchQuery: searchQuery || '',
                minPrice: minPrice || '',
                maxPrice: maxPrice || '',
                sortBy: sortBy || ''
            });
        }

        res.render('user/all_category', { 
            products, 
            selectedCategory: selectedCategory || '',
            selectedTag: selectedTag || '',
            searchQuery: searchQuery || '',
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            sortBy: sortBy || ''
        });
    });
});

// redirect /all-category to /all-books
app.get('/all-category', (req, res) => {
    const queryString = req.url.split('?')[1];
    if (queryString) {
        res.redirect('/all-books?' + queryString);
    } else {
        res.redirect('/all-books');
    }
});

//go to cart-page
app.get('/cart', (req, res) => {
    if (!req.session.user) {
        return res.render('user/cart_page', { cartItems: [], subtotal: 0, wishlistedProductIds: [] });
    }

    const userId = req.session.user.id;
    const query = `
        SELECT c.cart_id, c.quantity, p.product_id, p.product_name, p.price, p.price_discount, p.img_link
        FROM shopping_cart c
        JOIN product p ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching cart:', err);
            return res.render('user/cart_page', { cartItems: [], subtotal: 0, wishlistedProductIds: [] });
        }

        // Fetch user's active wishlisted product IDs
        db.query('SELECT product_id FROM wishlist WHERE user_id = ?', [userId], (err2, wishResults) => {
            const wishlistedProductIds = !err2 ? wishResults.map(item => item.product_id) : [];

            let subtotal = 0;
            results.forEach(item => {
                const itemPrice = item.price_discount || item.price;
                subtotal += itemPrice * item.quantity;
            });

            res.render('user/cart_page', { 
                cartItems: results, 
                subtotal: subtotal, 
                wishlistedProductIds: wishlistedProductIds 
            });
        });
    });
});

app.post('/cart/remove', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { cart_id } = req.body;
    db.query('DELETE FROM shopping_cart WHERE cart_id = ? AND user_id = ?', [cart_id, req.session.user.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, message: 'Item removed' });
    });
});

app.post('/cart/update', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { cart_id, quantity } = req.body;
    db.query('UPDATE shopping_cart SET quantity = ? WHERE cart_id = ? AND user_id = ?', [quantity, cart_id, req.session.user.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, message: 'Quantity updated' });
    });
});

// Add to Cart API
app.post('/cart/add', (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'Please login first' });
        }
        const { product_id, quantity = 1 } = req.body;
        const addQty = parseInt(quantity, 10) || 1;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Invalid product ID. Product ID is missing.' });
        }
        const user_id = req.session.user.id;

        db.query('SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, results) => {
            if (err) {
                console.error('DB Error in SELECT cart:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (results.length > 0) {
                db.query('UPDATE shopping_cart SET quantity = quantity + ? WHERE cart_id = ?', [addQty, results[0].cart_id], (err2) => {
                    if (err2) return res.status(500).json({ success: false, message: 'Database error' });
                    res.json({ success: true, message: 'Product quantity updated in your cart!' });
                });
            } else {
                db.query('INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, addQty], (err3) => {
                    if (err3) return res.status(500).json({ success: false, message: 'Database error' });
                    res.json({ success: true, message: 'Product added to your cart!' });
                });
            }
        });
    } catch (e) {
        console.error('Unexpected error in /cart/add:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add to Wishlist API
app.post('/wishlist/add', (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'Please login first' });
        }
        const { product_id } = req.body;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        const user_id = req.session.user.id;

        db.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Database error' });
            
            if (results.length > 0) {
                res.json({ success: true, message: 'Product is already in your wishlist!' });
            } else {
                db.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [user_id, product_id], (err3) => {
                    if (err3) return res.status(500).json({ success: false, message: 'Database error' });
                    res.json({ success: true, message: 'Product added to your wishlist!' });
                });
            }
        });
    } catch (e) {
        console.error('Unexpected error in /wishlist/add:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

//go to comics
app.get('/comics', (req, res) => {
    res.render('user/comics');
});

//go to fiction
app.get('/fiction', (req, res) => {
    res.render('user/fiction');
});

//go to languages
app.get('/lang', (req, res) => {
    res.render('user/languages');
});


//go to contact
app.get('/contact', (req, res) => {
    res.render('user/contact');
});

//go to home
app.get('/home', (req, res) => {
    db.query('SELECT * FROM promotion_groups WHERE is_active = 1 AND end_time > NOW() ORDER BY end_time ASC LIMIT 1', (err, promoResults) => {
        const activePromoGroup = (promoResults && promoResults.length > 0) ? promoResults[0] : null;
        res.render('user/home', { product : app.locals.products, activePromoGroup });
    });
});

//go to login
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/home');
    res.render('user/login', { layout: false });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.send('<script>alert("User not found"); window.location.href="/login";</script>');
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user.user_id, name: user.name, email: user.email };
            res.redirect('/home');
        } else {
            res.send('<script>alert("Incorrect password"); window.location.href="/login";</script>');
        }
    });
});

//go to product-page
app.get('/product-page', (req, res) => {
    const productId = req.query.id;
    if (!productId) {
        return res.redirect('/home');
    }
    db.query('SELECT * FROM product WHERE product_id = ?', [productId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching product:', err);
            return res.redirect('/home');
        }
        const product = results[0];
        
        if (req.session.user) {
            db.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [req.session.user.id, productId], (err2, wishResults) => {
                const isWishlisted = !err2 && wishResults.length > 0;
                res.render('user/product_page', { product, isWishlisted });
            });
        } else {
            res.render('user/product_page', { product, isWishlisted: false });
        }
    });
});

//go to registration
app.get('/registration', (req, res) => {
    if (req.session.user) return res.redirect('/home');
    res.render('user/registration', { layout: false });
});

app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.send('<script>alert("Passwords do not match"); window.location.href="/registration";</script>');
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.send('<script>alert("Email already exists"); window.location.href="/registration";</script>');
                return res.status(500).send('Database error');
            }
            res.send('<script>alert("Registration successful! Please login."); window.location.href="/login";</script>');
        });
    } catch (e) {
        res.status(500).send('Server error');
    }
});

//go to home(signout)
app.get('/sign-out', (req, res) => {
    req.session.destroy();
    res.redirect('/home');
});
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));




app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });

  //all page link use wehn all page for html finished

//Home start page

