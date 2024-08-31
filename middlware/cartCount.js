const Cart = require('../models/cartModel');

const cartCountMiddleware = async (req, res, next) => {
    // console.log(req.session)
  if ( req.session) {
    try {
      const cart = await Cart.findOne({ userId: req.session.user });
      
      // console.log(cart);
      
      const cartCount = cart ? cart.items.length : 0;
      res.locals.cartCount = cartCount;
      res.locals.user = req.session.user;
     
    } catch (error) {
      console.error('Error fetching cart count:', error);
      res.locals.cartCount = 0;
     
    }
  } else {
    res.locals.cartCount = 0;
  }
  next();
};

module.exports = cartCountMiddleware;
