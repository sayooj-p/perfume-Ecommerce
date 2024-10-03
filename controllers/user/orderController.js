const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Address = require("../../models/addressModel");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel");
const Coupon = require('../../models/couponModel');
const Wallet = require('../../models/walletModel')
const pdf = require('html-pdf');
const path = require('path');
const ejs = require('ejs');

const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.query.orderId;
       
        
        const order = await Order.findById(orderId).populate('orderItems.product');
        if (!order) {
          console.log("kittyillaaa");
          
            return res.redirect("/pageNotFound");
        }
        const html = await ejs.renderFile(path.join(__dirname, '../../views/user/invoiceTemplate.ejs'), { order });
        const options = {
            format: 'A4',
            border: {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            }
        };

        pdf.create(html, options).toStream((err, stream) => {
            if (err) {
                console.error('Error while generating PDF:', err);
                res.redirect("/pageNotfound")
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.orderId}.pdf`);
            stream.pipe(res);
        });

    } catch (error) {
        console.error('Error while downloading invoice:', error);
        res.redirect("/pageNotfound")
    }
};




// Controller to handle order placement




// Controller to handle ordersuccess page rendering
const getOrderDetails = async (req, res) => {
  try {
    const user = req.session.user;
    const { orderId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await Order.findById(orderId).populate('orderItems.product').populate('address');
    if (!order) {
      return res.redirect('/pageNotFound');
    }

    // Assuming you want to render a page for order details
    res.render("orderSuccess", { order,user });
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
      return res.redirect('/pageNotFound')
    }

    // Find the order by its ID
    const order = await Order.findById(orderId)
      .populate("orderItems.product")
      
      // console.log(order);
      

    // Check if the order exists
    if (!order) {
      return res.redirect('/pageNotFound');
    }
    if(order.status === 'Delivered'){
      order.paymentStatus = 'Paid'
      await order.save();
    }

    // Render the order details page
    res.render("viewOrderDetails", { order, user });
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
    if (order.paymentStatus === 'Paid') {
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
          wallet = new Wallet({
              userId: order.userId,
              balance: 0,
              transactions: []
          });
      }
      wallet.balance += order.finalAmount;
      wallet.transactions.push({
          amount: order.finalAmount,
          type: 'credit',
          orderId: order._id,
          description: `Cancelled order amount for Order ID: ${order.orderId}`
      });
      await wallet.save();
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
    
    // Populate the `product` field in `orderItems`
    const orders = await Order.find({ userId }).populate('orderItems.product').sort({createdOn:-1})
    
    res.render('myOrder', {
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: "Failed to retrieve orders." });
  }
};







const returnOrder = async (req, res) => {
  try {
      const { orderId } = req.body;

      if (!orderId) {
          return res.status(400).json({ success: false, message: 'Order ID is required.' });
      }

      // Find the order by ID
      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Check if the order status is "Delivered"
      if (order.status !== 'Delivered') {
          return res.status(400).json({ success: false, message: 'Return is only available for delivered orders.' });
      }

      // Update the order status to "Return Requested"
      order.status = 'Return Request';
      await order.save();
    //   if (order.status === 'Returned'&& order.paymentStatus === 'Paid') {
    //     let wallet = await Wallet.findOne({ userId: order.userId });
    //     if (!wallet) {
    //         wallet = new Wallet({
    //             userId: order.userId,
    //             balance: 0,
    //             transactions: []
    //         });
    //     }
    //     wallet.balance += order.finalAmount;
    //     wallet.transactions.push({
    //         amount: order.finalAmount,
    //         type: 'credit',
    //         orderId: order._id,
    //         description: `return order amount for Order ID: ${order.orderId}`
    //     });
    //     await wallet.save();
    // }

      res.json({ success: true, message: 'Return request placed successfully.' });
  } catch (error) {
      console.error('Error placing return request:', error);
      res.status(500).json({ success: false, message: 'An error occurred while placing the return request.' });
  }
};






module.exports = {

  getOrderDetails,
  viewOrderDetails,
  cancelOrder,
  myOrder,
  returnOrder,
  downloadInvoice
};
