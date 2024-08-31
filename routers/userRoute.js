const express = require('express');
const user_route = express();
const userController = require("../controllers/user/userController");
const addressController = require('../controllers/user/addressController');
const cartController = require('../controllers/user/cartController')
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const shopController = require('../controllers/user/shopController');
const passport = require("../config/passport")
const userAuth= require('../middlware/auth');

user_route.set("view engine", "ejs");
user_route.set("views", "./views/user");
user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

//user managment
user_route.use(passport.initialize());
user_route.use(passport.session());

user_route.get('/pageNotFound', userAuth, userController.pageNotFound);
user_route.get('/', userController.loadHome);
user_route.get('/home', userAuth, userController.loadHome);
user_route.get('/signup', userController.loadRegister);
user_route.post('/signup', userController.insertUser);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.post('/resend-otp', userController.resendOtp);
user_route.get('/productdetails/:id', userController.loadProductDetails);

user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
user_route.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
if(req.user){
  req.session.user=req.user;  
}
  res.redirect('/');
});
user_route.get('/login', userController.loginLoader);
user_route.post('/login', userController.login);
user_route.get('/logout', userController.logout);

//profile managment
user_route.get('/profile',userAuth,userController.profileDetails);
user_route.get('/edit-profile',userAuth,userController.getProfile);
user_route.post('/edit-profile/:userId',userAuth,userController.updateProfile);
user_route.get('/change-password',userAuth,userController.getchangePassword);


user_route.post('/change-password',userAuth,userController.changePassword);
user_route.get('/forget-password',userAuth,userController.getForgetPassword);
user_route.get('/otp-page',userAuth,userController.getOtp)
user_route.post('/verifyOtpForgotPassword',userAuth, userController.verifyOtpForgotPassword);
user_route.get('/loadResetPassword',userAuth, userController.loadResetPassword);
user_route.post('/changeForgotPassword',userAuth, userController.changeForgotPassword);
user_route.post('/resend-otp-forget', userAuth,userController.resendOtpForget);


//addressManagment

user_route.get('/manage-address',userAuth,addressController.getManageAddress);
user_route.get('/add-address',userAuth,addressController.loadAddAddress);
user_route.post('/add-address',userAuth,addressController.addAddress);
user_route.get('/edit-address/:addressId',userAuth,addressController.editAddress);
user_route.post('/update-address/:addressId', userAuth, addressController.updateAddress);
user_route.delete('/delete-address/:addressId',userAuth,addressController.deleteAddress);


//cart Managment
user_route.get('/cart',userAuth,cartController.getCart);
user_route.post('/cart',userAuth,cartController.addItemToCart);
user_route.delete('/cart/:productId',userAuth,cartController.deleteCart);
user_route.post('/update-cart-item',userAuth,cartController.updateCart);

//checkout managment
user_route.get('/checkout',userAuth,checkoutController.getCheckout);
user_route.get('/manage-address',userAuth,checkoutController.getManageAddress);
user_route.get('/add-address',userAuth,checkoutController.loadAddAddress);
user_route.post('/add-address',userAuth,checkoutController.addAddress);
user_route.get('/edit-address/:addressId',userAuth,checkoutController.editAddress);
user_route.post('/update-address/:addressId', userAuth, checkoutController.updateAddress);

//shop managment

user_route.get('/shop',shopController.getShop);
// user_route.post('/shop',userAuth,shopController.getShop);


//order Managment

user_route.get('/order-success',userAuth,orderController.getOrderDetails);
user_route.post('/order-success',userAuth,orderController.placeOrder);
user_route.get('/view-orderDetails/:orderId',userAuth,orderController.viewOrderDetails);
user_route.post('/cancelOrder',userAuth,orderController.cancelOrder);

user_route.get('/myOrder',userAuth,orderController.myOrder);





module.exports = user_route;
