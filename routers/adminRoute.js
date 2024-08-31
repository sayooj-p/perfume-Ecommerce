const express = require('express');
const admin_route = express();
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const productController = require('../controllers/admin/productController');
const categoryController = require('../controllers/admin/categoryController');
const orderController = require('../controllers/admin/orderController');
const adminAuth = require("../middlware/adminAuth");
const upload = require('../middlware/multer')
const session = require('express-session');

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");
admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));
admin_route.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000
    }
}));

// Login Management
admin_route.get('/login', adminController.loadLogin);
admin_route.post('/login', adminController.login);
admin_route.get('/', adminAuth, adminController.loadDashboard);
admin_route.get('/logout', adminController.logout);

// User Management
admin_route.get('/users', adminAuth, customerController.customerDetails);
admin_route.get('/userblock', adminAuth, customerController.toggleUserBlockStatus);
admin_route.get('/userunblock', adminAuth, customerController.toggleUserBlockStatus);

// Product Management
admin_route.get('/products', adminAuth, productController.getProducts);
admin_route.get('/add-product', adminAuth, productController.loadAddProduct);
admin_route.post('/add-product', adminAuth, upload.fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
]), productController.addProduct);
admin_route.get('/edit-product/:id', adminAuth, productController.getEditProduct);
admin_route.post('/update-product/:id', adminAuth, upload.fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
]), productController.updateProduct);
admin_route.get('/listproducts', adminAuth, productController.listProduct);
admin_route.get('/unlistproducts', adminAuth, productController.unlistProduct);
admin_route.delete('/delete-image', adminAuth, productController.deleteImage);

// Category Management
admin_route.get('/category', adminAuth, categoryController.categoryDetails);
admin_route.get('/add-Category', adminAuth, categoryController.loadAddCategory);
admin_route.post('/add-Category', adminAuth, categoryController.addCategory);
admin_route.get('/listCategory', adminAuth, categoryController.getListCategory);
admin_route.get('/unlistCategory', adminAuth, categoryController.getUnListCategory);
admin_route.get('/edit-category/:id', adminAuth, categoryController.editCategory);
admin_route.post('/edit-category/:id', adminAuth, categoryController.updateCategory);

//order managment

admin_route.get('/orderList', adminAuth, orderController.getOrder);
admin_route.get('/viewOrder/:orderId', adminAuth, orderController.viewOrder);
admin_route.post('/updateOrderStatus', adminAuth, orderController.updateOrderStatus);


module.exports = admin_route;
