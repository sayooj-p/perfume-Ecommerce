const Wishlist = require('../models/wishListModel');

const wishListCountMiddleware = async (req, res, next) => {
    // console.log(req.session)
  if ( req.session) {
    try {
      const wishList = await Wishlist.findOne({ userId: req.session.user });
      
      // console.log(cart);
      
      const wishListCount = wishList ? wishList.products.length : 0;
      res.locals.wishListCount = wishListCount;
      res.locals.user = req.session.user;
     
    } catch (error) {
      console.error('Error fetching cart count:', error);
      res.locals.wishListCount = 0;
     
    }
  } else {
    res.locals.wishListCount = 0;
  }
  next();
};

module.exports = wishListCountMiddleware;
