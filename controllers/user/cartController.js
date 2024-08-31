const Cart = require("../../models/cartModel");
const Product = require("../../models/productModel");
// const User = require('../../models/userModel')

const getCart = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = req.session.user._id;

    // Log the userId to ensure it's correct
    // console.log(`Fetching cart for userId: ${userId}`);

    let cart = await Cart.findOne({ userId }).populate("items.productId");

    // Log the result of the cart query
    // console.log("Cart:", cart);

    if (!cart) {
      // If no cart exists, initialize an empty cart
      cart = await Cart.create({ userId, items: [] });
      console.log("Created new cart for user");
    }

    let total = 0;

    cart.items = cart.items.filter((item) => {
      if (item.productId) {
        item.totalPrice = item.quantity * item.price;
        total += item.totalPrice;

        return true;
      } else {
        return false;
      }
    });


    res.render("cart", { cartItems: cart.items, total, user });
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
    const cart = await Cart.findOne({ userId });

    if (cart) {
      // Find the item in the cart
      const item = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (item) {
        item.quantity = quantity;
        item.totalPrice = item.price * quantity;

        // Save the updated cart
        await cart.save();

        let total = 0;

        cart.items = cart.items.filter((item) => {
          if (item.productId) {
            item.totalPrice = item.quantity * item.price;
            total += item.totalPrice;

            return true;
          } else {
            return false;
          }
        });

        return res.json({ success: true, itemTotal: item.totalPrice ,grandTotal:total });
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
