const express = require('express');
const userRoute = express();
const userController = require("../controllers/user/userController");
const addressController = require('../controllers/user/addressController');
const cartController = require('../controllers/user/cartController')
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const shopController = require('../controllers/user/shopController');
const wishListController = require('../controllers/user/wishListController');
const walletController = require('../controllers/user/walletController');
const passport = require("../config/passport")
const userAuth= require('../middlware/auth');



userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");
userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

//user managment
userRoute.use(passport.initialize());
userRoute.use(passport.session());

userRoute.get('/pageNotFound', userAuth, userController.pageNotFound);
userRoute.get('/serverError', userAuth, userController.serverError);
userRoute.get('/', userController.loadHome);
userRoute.get('/home', userAuth, userController.loadHome);
userRoute.get('/signup', userController.loadRegister);
userRoute.post('/signup', userController.insertUser);
userRoute.post('/verify-otp', userController.verifyOtp);
userRoute.post('/resend-otp', userController.resendOtp);
userRoute.get('/productdetails/:id', userController.loadProductDetails);

userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
if(req.user){
  req.session.user=req.user;  
}
  res.redirect('/');
});
userRoute.get('/login', userController.loginLoader);
userRoute.post('/login', userController.login);
userRoute.get('/logout', userController.logout);

//profile managment
userRoute.get('/profile',userAuth,userController.profileDetails);
userRoute.get('/editProfile',userAuth,userController.getProfile);
userRoute.post('/editProfile/:userId',userAuth,userController.updateProfile);
userRoute.get('/changePassword',userAuth,userController.getchangePassword);


userRoute.post('/changePassword',userAuth,userController.changePassword);
userRoute.get('/forgetPassword',userAuth,userController.getForgetPassword);
userRoute.get('/otp-page',userAuth,userController.getOtp)
userRoute.post('/verifyOtpForgotPassword',userAuth, userController.verifyOtpForgotPassword);
userRoute.get('/loadResetPassword',userAuth, userController.loadResetPassword);
userRoute.post('/changeForgotPassword',userAuth, userController.changeForgotPassword);
userRoute.post('/resend-otp-forget', userAuth,userController.resendOtpForget);


//addressManagment

userRoute.get('/manageAddress',userAuth,addressController.getManageAddress);
userRoute.get('/addAddress',userAuth,addressController.loadAddAddress);
userRoute.post('/addAddress',userAuth,addressController.addAddress);
userRoute.get('/editAddress/:addressId',userAuth,addressController.editAddress);
userRoute.post('/updateAddress/:addressId', userAuth, addressController.updateAddress);
userRoute.delete('/deleteAddress/:addressId',userAuth,addressController.deleteAddress);


//cart Managment
userRoute.get('/cart',userAuth,cartController.getCart);
userRoute.post('/cart',userAuth,cartController.addItemToCart);
userRoute.delete('/cart/:productId',userAuth,cartController.deleteCart);
userRoute.post('/updateCartItem',userAuth,cartController.updateCart);

//checkout managment
userRoute.get('/checkout',userAuth,checkoutController.getCheckout);
userRoute.get('/manageAddress',userAuth,checkoutController.getManageAddress);
userRoute.get('/addAddress',userAuth,checkoutController.loadAddAddress);
userRoute.post('/addAddress',userAuth,checkoutController.addAddress);
userRoute.get('/editAddress/:addressId',userAuth,checkoutController.editAddress);
userRoute.post('/updateAddress/:addressId', userAuth, checkoutController.updateAddress);
userRoute.post('/applyCoupon', userAuth, checkoutController.applyCoupon);
userRoute.post('/createOrder',userAuth,checkoutController.createOrder);
userRoute.post('/verifyPayment',userAuth,checkoutController.verifyPayment);
userRoute.post('/orderSuccess',userAuth,checkoutController.placeOrder);
userRoute.post('/initiateRepayment' ,userAuth,checkoutController.initiateRepayment)
userRoute.post('/verifyRepayment' ,userAuth,checkoutController.verifyRepayment)



//shop managment

userRoute.get('/shop',shopController.getShop);
// user_route.post('/shop',userAuth,shopController.getShop);
  

//order Managment

userRoute.get('/orderSuccess',userAuth,orderController.getOrderDetails);

userRoute.get('/viewOrderDetails/:orderId',userAuth,orderController.viewOrderDetails);
userRoute.post('/cancelOrder',userAuth,orderController.cancelOrder);
userRoute.post('/returnOrder',userAuth,orderController.returnOrder);
userRoute.get('/myOrder',userAuth,orderController.myOrder);
userRoute.get('/downloadInvoice',userAuth,orderController.downloadInvoice);

//wishList Managment
userRoute.get('/wishList',userAuth,wishListController.getWishList)
userRoute.post('/wishList',userAuth,wishListController.addToWishList);
userRoute.delete('/wishList/:productId',userAuth,wishListController.deleteWishList);

//wallet

userRoute.get('/loadWallet',userAuth,walletController.loadWalletPage)




module.exports = userRoute;
