const Order = require('../../models/orderModel');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const mongoose = require("mongoose");



const getOrder  = async (req,res)=>{
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 4;
        const orders=await Order.find({}).populate('userId').sort({createdOn:-1})
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await Order.countDocuments({
            $or: [
                { orderId: { $regex: ".*" + search + ".*", $options: "i" } },
                { status: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        });

        res.render('orderList', {
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

        
    } catch (error) {
        console.log('error show page order list ',error);
        res.status(500).send('Internal Server error');
        
        
    }
}
const viewOrder = async (req,res)=>{
    try {
        const {orderId} = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid Order ID" });
          }
          const order = await Order.findById(orderId)
          .populate("orderItems.product")

          if (!order) {
            return res.status(404).json({ message: "Order not found" });
          }
        res.render('viewOrder',{order});
        
        
    } catch (error) {
        console.log('error to load page view order',error);
        res.status(500).send('Internal server error');
        
    }
}
const updateOrderStatus = async (req, res) => {
    try {
      const { orderId, status } = req.body;
  
      if (!orderId || !status) {
        return res.status(400).json({ success: false, message: 'Order ID and status are required.' });
      }
  
      // Find the order and update its status
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
  
      order.status = status;
      await order.save();

      if(status==='Cancelled'){
    for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity += item.quantity;  
          await product.save();
        }
      }
      }
  
      res.json({ success: true, message: 'Order status updated successfully.' });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ success: false, message: 'An error occurred while updating the order status.' });
    }
  };


module.exports = {
    getOrder,
    viewOrder,
    updateOrderStatus
}