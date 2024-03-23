const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const ejs = require('ejs'); // Correct 

const multer = require("multer");//body-parser upgrad
const upload = multer();

app.use(bodyParser.json());

app.use(upload.none());
app.set('view engine', 'ejs');

// access to css / photo file
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Tun-48449",
    database: "fe_book"
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
    res.render('admin/add_category', {name:'Add'});
});


//go to manage-category
app.get('/manage-category', (req, res) => {
    res.render('admin/manage_category' ,{ category : app.locals.category });
});











//go to edit-category
app.get('/edit-category', (req, res) => {
    res.render('admin/edit_category', {name:'Edit'});
});


//go to add-product
app.get('/add-product', (req, res) => {
    res.render('admin/add_product', {name:'Add'});
});

//go to edit-product
app.get('/edit-product', (req, res) => {
    res.render('admin/edit_product');
});
//go to manage-product
app.get('/manage-product', (req, res) => {
    res.render('admin/manage_product');
});

//go to top-product
app.get('/top-product', (req, res) => {
    res.render('admin/top_product');
});

//go to bill-summary
app.get('/bill-summary', (req, res) => {
    res.render('admin/bill_summary');
});

//go to staff-login
app.get('/staff-login', (req, res) => {
    res.render('admin/staff_login');
});

//go to staff-order
app.get('/staff-order', (req, res) => {
    res.render('admin/staff_order');
});

//go to staff-product-dashboard
app.get('/dashboard', (req, res) => {
    res.render('admin/dashboard');
});
//go to staff-product-product
app.get('/staff-product', (req, res) => {
    res.render('admin/staff_product');
});
//go to staff-product-order
app.get('/staff-order', (req, res) => {
    res.render('admin/staff_order');
});
//go to staff-product-setting
app.get('/staff-setting', (req, res) => {
    res.render('admin/staff_setting');
});

//go to staff-setting
app.get('/staff-setting', (req, res) => {
    res.render('admin/staff_setting');
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
    res.render('user/cart_page');
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
    res.render('user/login');
});

//go to product-page
app.get('/product-page', (req, res) => {
    res.render('user/product_page');
});

//go to registration
app.get('/registration', (req, res) => {
    res.render('user/registration');
});

//go to home(signout)
app.get('/sign-out', (req, res) => {
    res.render('user/home');
});
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));




app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });

  //all page link use wehn all page for html finished

//Home start page

