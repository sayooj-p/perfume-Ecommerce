const Cart = require("../../models/cartModel");
const Product = require("../../models/productModel");
// const User = require('../../models/userModel')

const getCart = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch the cart and populate product and category details
    let cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category", model: "Category" } // Assuming you have a category model
    });

    if (!cart) {
      // If no cart exists, initialize an empty cart
      cart = await Cart.create({ userId, items: [] });
      console.log("Created new cart for user");
    }

    let total = 0;
    let totalOfferDiscount = 0;

    // Calculate total and discount
    cart.items = cart.items.filter((item) => {
      if (item.productId) {
        const productOffer = item.productId.productOffer || 0; // Get product-specific offer
        const categoryOffer = item.productId.category.categoryOffer || 0; // Get category offer (use optional chaining in case category doesn't exist)
        
        // Apply the higher offer between product offer and category offer
        const effectiveOffer = (productOffer >= categoryOffer) ? productOffer : categoryOffer;
        const offerDiscount = (effectiveOffer * item.price / 100) * item.quantity; // Calculate discount based on the effective offer

        // Calculate total price and accumulate total discount
        item.totalPrice = item.quantity * item.price; // Total without discount
        totalOfferDiscount += offerDiscount; // Accumulate the total discount
        total += item.totalPrice - offerDiscount; // Update total after applying discount

        return true; // Keep the item in the cart
      } else {
        return false; // Remove the item if it doesn't have a valid productId
      }
    });

    // Render the cart page with total and discount values
    res.render("cart", { cartItems: cart.items, total, totalOfferDiscount });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};



const addItemToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
      console.log("Created new cart for user");
    }

    const product = await Product.findById(productId); // Fetch product to get its price

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        totalPrice: quantity * product.price,
      });
    }

    await cart.save();
    // console.log("Cart updated:", cart);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
const deleteCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.productId;

    const result = await Cart.updateOne(
      { userId },
      { $pull: { items: { productId: productId } } } // Ensure you're targeting the correct field
    );
    // console.log(result);

    if (result.modifiedCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const updateCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.session.user._id; // Assuming you're storing user ID in the session

  try {
    // Find the cart for the logged-in user
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (cart) {
      // Find the item in the cart
      const item = cart.items.find((item) => item.productId._id.toString() === productId);

      if (item) {
        // Update the quantity and recalculate the total price and discount
        item.quantity = quantity;
        const productOffer = item.productId.productOffer || 0; // Get the product's offer
        const categoryOffer = item.productId.category.categoryOffer || 0;
        if(productOffer) {
          const offerDiscount = (productOffer * item.price / 100) * item.quantity; // Calculate offer discount
          item.totalPrice = item.quantity * item.price ; // Total price after discount
          item.total = item.totalPrice - offerDiscount;
        }else {
          const offerDiscount = (categoryOffer * item.price / 100) * item.quantity; 
          item.totalPrice = item.quantity * item.price ;
          item.total = item.totalPrice - offerDiscount;
        }
       
        
        // Save the updated cart
        await cart.save();

        // Recalculate the grand total and total discounts
        let grandTotal = 0;
        let totalOfferDiscount = 0;

        cart.items.forEach((cartItem) => {
          const cartItemOffer = cartItem.productId.productOffer || 0;
          const cartItemDiscount = (cartItemOffer * cartItem.price / 100) * cartItem.quantity;
          totalOfferDiscount += cartItemDiscount;
          grandTotal += cartItem.quantity * cartItem.price - cartItemDiscount;
        });

        // Send back the updated totals for the front-end
        return res.json({ 
          success: true, 
          itemTotal: item.totalPrice,
          grandTotal, 
          totalOfferDiscount 
        });
      }
    }

    res.json({ success: false, message: "Cart or item not found" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = {
  getCart,
  addItemToCart,
  deleteCart,
  updateCart,
};
