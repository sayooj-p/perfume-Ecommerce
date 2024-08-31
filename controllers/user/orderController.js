const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Address = require("../../models/addressModel");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel");
const { v4: uuidv4 } = require('uuid');

// Controller to handle order placement
const placeOrder = async (req, res) => {
  try {
   
    const userId = req.session.user._id;
    if (!userId) {
      return res.status(400).json({ message: "User not found" });
    }

    const { addressId, cartId, paymentMethod } = req.body;

    // Fetch the cart and address
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(400).json({ message: "Invalid cart" });
    }

    const addressDocument = await Address.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 }
    );
    if (!addressDocument) {
      return res.status(404).json({ message: "Address not found" });
    }

    const address = addressDocument.address[0]; // Use the _id reference of the address

    console.log(address)
    // Calculate the total price
    const totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    // Generate a custom numeric orderId
    function generateNumericUuid(length = 16) {
      const uuid = uuidv4().replace(/\D/g, '').slice(0, length);
      return `#${uuid}`;
    }

    const numericUuid = generateNumericUuid(16);

    // Create the order
    const newOrder = new Order({
      userId,
      orderId: numericUuid,
      orderItems: cart.items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice,
      status: "Pending",
      paymentMethod,
      address: {
        addressType: address.addressType,
        name: address.name,
        city: address.city,
        landmark: address.landmark,
        state: address.state,
        pincode: address.pincode,
        phone: address.phone,
        altPhone: address.altPhone,
        isActive: true,
        locality: address.locality,
      
      }
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    // Clear the cart after placing the order
    await Cart.findByIdAndDelete(cartId);

    // Update the product quantities
    for (const item of savedOrder.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity -= item.quantity;  // Restore the product quantity
        await product.save();
      }
    }


    // Redirect to the order-success page with the order ID
    res.redirect(`/order-success?orderId=${savedOrder._id}`);
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "An error occurred while placing the order." });
  }
};

// Controller to handle order-success page rendering
const getOrderDetails = async (req, res) => {
  try {
    const user = req.session.user;
    const { orderId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await Order.findById(orderId).populate('orderItems.product').populate('address');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Assuming you want to render a page for order details
    res.render("order-success", { order,user });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'An error occurred while retrieving the order.' });
  }
};

// Controller to handle viewing order details
const viewOrderDetails = async (req, res) => {
  try {
    const user = req.session.user;
    const { orderId } = req.params; // Get orderId from the route parameters

    // Validate the orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    // Find the order by its ID
    const order = await Order.findById(orderId)
      .populate("orderItems.product")
      
      console.log(order);
      

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Render the order details page
    res.render("view-orderDetails", { order, user });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "An error occurred while retrieving the order details." });
  }
};
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order by ID
    const order = await Order.findById(orderId);

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order is already cancelled
    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Update the order status to 'Cancelled'
    order.status = 'Cancelled';
    await order.save();

    // Update the product quantities
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;  // Restore the product quantity
        await product.save();
      }
    }

    // Respond with success message
    return res.status(200).json({  success:true,message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error while cancelling order:', error);

    // Respond with a generic error message
    return res.status(500).json({message: 'Failed to cancel order' });
  }
};
const myOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orders = await Order.find({ userId }).populate('orderItems.product');
    
    res.render('myOrder', {
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to retrieve orders." });
  }
};



module.exports = {
  placeOrder,
  getOrderDetails,
  viewOrderDetails,
cancelOrder,
myOrder
};
