const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts'); 
const session = require('express-session');
const bcrypt = require('bcrypt');

const multer = require("multer");//body-parser upgrad
const upload = multer();

app.use(bodyParser.json());
app.use(upload.none());

app.use(session({
    secret: 'calamity-book-secret',
    resave: false,
    saveUninitialized: false
}));

// middleware to pass user session to templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});
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
    // Now you can start fetching products
    fetchProducts();
    fetchCategory();
});

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
    res.render('user/home', { product : app.locals.products });
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

        res.redirect('/manage-category');
        
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


//go to add-category
app.get('/add-category', (req, res) => {
    res.render('admin/add_category', {name:'Add', layout: false});
});


//go to manage-category
app.get('/manage-category', (req, res) => {
    res.render('admin/manage_category' ,{ category : app.locals.category , layout: false});
});











//go to edit-category
app.get('/edit-category', (req, res) => {
    res.render('admin/edit_category', {name:'Edit', layout: false});
});


//go to add-product
app.get('/add-product', (req, res) => {
    res.render('admin/add_product', {name:'Add', layout: false});
});

//go to edit-product
app.get('/edit-product', (req, res) => {
    res.render('admin/edit_product', { layout: false });
});
//go to manage-product
app.get('/manage-product', (req, res) => {
    res.render('admin/manage_product', { layout: false });
});

//go to top-product
app.get('/top-product', (req, res) => {
    res.render('admin/top_product', { layout: false });
});

//go to bill-summary
app.get('/bill-summary', (req, res) => {
    res.render('admin/bill_summary', { layout: false });
});

//go to staff-login
app.get('/staff-login', (req, res) => {
    res.render('admin/staff_login', { layout: false });
});

//go to staff-order
app.get('/staff-order', (req, res) => {
    res.render('admin/staff_order', { layout: false });
});

//go to staff-product-dashboard
app.get('/dashboard', (req, res) => {
    res.render('admin/dashboard', { layout: false });
});
//go to staff-product-product
app.get('/staff-product', (req, res) => {
    res.render('admin/staff_product', { layout: false });
});
//go to staff-product-order
app.get('/staff-order', (req, res) => {
    res.render('admin/staff_order', { layout: false });
});
//go to staff-product-setting
app.get('/staff-setting', (req, res) => {
    res.render('admin/staff_setting', { layout: false });
});

//go to staff-setting
app.get('/staff-setting', (req, res) => {
    res.render('admin/staff_setting', { layout: false });
});
//go to address-book
app.get('/address-book', (req, res) => {
    res.render('user/address_book');
});

//go to my-order
app.get('/my-order', (req, res) => {
    res.render('user/my_order');
});

//go to my-wishlist
app.get('/wishlist', (req, res) => {
    res.render('user/my_wishlist');
});

app.get('/test', (req, res) => {
    res.render('user/test');
});

//go to track-order
app.get('/track-order', (req, res) => {
    res.render('user/track_order');
});

//go to about-us
app.get('/about_us', (req, res) => {
    res.render('user/about_us');
});

//go to account-info
app.get('/account-info', (req, res) => {
    res.render('user/account_info');
});

//go to all-category
app.get('/all-category', (req, res) => {
    res.render('user/all_category');
});

//go to cart-page
app.get('/cart', (req, res) => {
    if (!req.session.user) {
        return res.render('user/cart_page', { cartItems: [], subtotal: 0 });
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
            return res.render('user/cart_page', { cartItems: [], subtotal: 0 });
        }

        let subtotal = 0;
        results.forEach(item => {
            const itemPrice = item.price_discount || item.price;
            subtotal += itemPrice * item.quantity;
        });

        res.render('user/cart_page', { cartItems: results, subtotal: subtotal });
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
    res.render('user/home');
});

//go to login
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/home');
    res.render('user/login');
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
        res.render('user/product_page', { product: results[0] });
    });
});

//go to registration
app.get('/registration', (req, res) => {
    if (req.session.user) return res.redirect('/home');
    res.render('user/registration');
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

