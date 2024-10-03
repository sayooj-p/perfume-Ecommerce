const express = require('express');
const   adminRoute = express();
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const productController = require('../controllers/admin/productController');
const categoryController = require('../controllers/admin/categoryController');
const orderController = require('../controllers/admin/orderController');
const couponController = require('../controllers/admin/couponController');
const sailesReportController = require('../controllers/admin/sailesReportController');
const adminAuth = require("../middlware/adminAuth");
const upload = require('../middlware/multer')
const session = require('express-session');

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");
adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));
adminRoute.use(session({
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
adminRoute.get('/login', adminController.loadLogin);
adminRoute.post('/login', adminController.login);
adminRoute.get('/', adminAuth, adminController.loadDashboard);
adminRoute.get('/logout', adminController.logout);

// User Management
adminRoute.get('/users', adminAuth, customerController.customerDetails);
adminRoute.get('/userblock', adminAuth, customerController.toggleUserBlockStatus);
adminRoute.get('/userunblock', adminAuth, customerController.toggleUserBlockStatus);

// Product Management
adminRoute.get('/products', adminAuth, productController.getProducts);
adminRoute.get('/addProduct', adminAuth, productController.loadAddProduct);
adminRoute.post('/addProduct', adminAuth, upload.fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
]), productController.addProduct);
adminRoute.get('/editProduct/:id', adminAuth, productController.getEditProduct);
adminRoute.post('/update-product/:id', adminAuth, upload.fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
]), productController.updateProduct);
adminRoute.get('/listProducts', adminAuth, productController.listProduct);
adminRoute.get('/unlistProducts', adminAuth, productController.unlistProduct);
adminRoute.delete('/delete-image', adminAuth, productController.deleteImage);
adminRoute.post('/addProductOffer',adminAuth,productController.addProductOffer);
adminRoute.post('/removeProductOffer',adminAuth,productController.removeProductOffer);

// Category Management
adminRoute.get('/category', adminAuth, categoryController.categoryDetails);
adminRoute.get('/addCategory', adminAuth, categoryController.loadAddCategory);
adminRoute.post('/addCategory', adminAuth, categoryController.addCategory);
adminRoute.get('/listCategory', adminAuth, categoryController.getListCategory);
adminRoute.get('/unlistCategory', adminAuth, categoryController.getUnListCategory);
adminRoute.get('/editCategory', adminAuth, categoryController.editCategory);
adminRoute.post('/editCategory/:id', adminAuth, categoryController.updateCategory);
adminRoute.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer);
adminRoute.post('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer);

//order managment

adminRoute.get('/orderList', adminAuth, orderController.getOrder);
adminRoute.get('/viewOrder/:orderId', adminAuth, orderController.viewOrder);
adminRoute.post('/updateOrderStatus', adminAuth, orderController.updateOrderStatus);

//coupon managment
adminRoute.get('/couponList',adminAuth,couponController.getCoupon);
adminRoute.get('/addCoupon', adminAuth, couponController.loadAddCoupon);
adminRoute.post('/addCoupon', adminAuth, couponController.addCoupon);
adminRoute.get('/listCoupon', adminAuth, couponController.listCoupon);
adminRoute.get('/unlistCoupon', adminAuth, couponController.unlistCoupon);


//sailes report

adminRoute.get('/getsalepage',adminAuth,sailesReportController.getSalesPage);
adminRoute.get('/excel',adminAuth, sailesReportController.downloadSalesReportExcel);
adminRoute.get('/pdf',adminAuth, sailesReportController.downloadSalesReportPDF);





module.exports = adminRoute;
