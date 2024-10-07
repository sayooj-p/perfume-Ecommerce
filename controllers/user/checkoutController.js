const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Address = require("../../models/addressModel");
const Product = require("../../models/productModel");
const Cart = require('../../models/cartModel');
const Order = require("../../models/orderModel");
const { session } = require("passport");
const { log } = require("debug/src/node");
const Coupon = require("../../models/couponModel");
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const crypto = require('crypto');


// Instantiate Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Address Controller

// 1. Get and Render Manage Address Page
const getManageAddress = async (req, res) => {
  try {
    const userId = req.session.user._id; // Assuming `userId` is stored in session

    // Fetch addresses only for the logged-in user
    const userAddresses = await Address.findOne({ userId }).populate("userId");
  
    

    if (!userAddresses) {
      return res.render("checkout", { addresses: [] });
    }

    let addresses = userAddresses.address;

    // Find the primary address
    const primaryAddressIndex = addresses.findIndex(
      (address) => address.isActive
    );
    const primaryAddress =
      primaryAddressIndex !== -1
        ? addresses.splice(primaryAddressIndex, 1)[0]
        : null;

    // Assume the last address in the list is the newly added one
    const newlyAddedAddress =
      addresses.length > 0
        ? addresses.splice(addresses.length - 1, 1)[0]
        : null;

    // Construct the final sorted array
    const sortedAddresses = [];
    if (primaryAddress) sortedAddresses.push(primaryAddress);
    if (newlyAddedAddress) sortedAddresses.push(newlyAddedAddress);
    sortedAddresses.push(...addresses); // Append the remaining addresses

    res.render("checkout", { addresses: sortedAddresses });
    // console.log("Addresses fetched:", sortedAddresses);
  } catch (error) {
    console.log("Error loading the manage address page", error);
    res.redirect("/pageNotFound");
  }
};

// 2. Load Add Address Page
const loadAddAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch the user data based on the userId
    const userData = await User.findById({ _id: userId });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    res.render("add-address", { userData });
    // console.log("User data loaded:", userData);
  } catch (error) {
    console.log("Error loading the add address page", error);
    res.status(500).send("Internal Server Error");
  }
};

// 3. Add New Address
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user._id; // Extract the userId from session
    const {
      name,
      phone,
      pincode,
      locality,
      city,
      state,
      addressType,
      alternative,
      landmark,
      isActive,
    } = req.body;

    if (
      !name ||
      !phone ||
      !pincode ||
      !locality ||
      !city ||
      !state ||
      !addressType
    ) {
      return res.status(400).send("All fields are required");
    }

    // Find the user's address document by userId
    const userAddressDocument = await Address.findOne({ userId });

    if (userAddressDocument) {
      // If isActive is true, set all existing addresses to inactive
      if (isActive) {
        userAddressDocument.address.forEach((address) => {
          address.isActive = false;
        });
        await userAddressDocument.save();
      }

      // Push new address to the existing document
      userAddressDocument.address.push({
        name,
        phone,
        locality,
        landmark,
        pincode,
        city,
        state,
        addressType,
        altPhone: alternative,
        isActive: isActive || false,
      });
      await userAddressDocument.save();

      // Ensure only one address is active
      if (isActive) {
        const activeAddress = userAddressDocument.address.find(
          (address) => address.isActive
        );

        if (!activeAddress && userAddressDocument.address.length > 0) {
          const lastAddedAddress =
            userAddressDocument.address[userAddressDocument.address.length - 1];

          await Address.updateOne(
            { userId, "address._id": lastAddedAddress._id },
            { $set: { "address.$.isActive": true } }
          );
        }
      }

      console.log("Address added to existing document:", userAddressDocument);
    } else {
      // Create a new address document for the user
      const newAddressDocument = new Address({
        userId: userId, // Correct reference to userId
        address: [
          {
            name,
            phone,
            locality,
            landmark,
            pincode,
            addressType,
            city,
            state,
            altPhone: alternative,
            isActive: isActive || true, // Set to true if no other addresses exist
          },
        ],
      });

      await newAddressDocument.save();
      // console.log("New address document created:", newAddressDocument);
    }

    res.redirect("/checkout");
    console.log("Address added successfully");
  } catch (error) {
    console.error("Error adding the address:", error);
    res.status(500).send("Internal Server Error");
  }
};


const editAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId } = req.params; // Get the addressId from the URL

    // Find the address by its `_id` in the user's address array
    const userAddress = await Address.findOne(
      { userId, "address._id": addressId },
      { "address.$": 1 } // Project only the matching address
    );

    if (
      !userAddress ||
      !userAddress.address ||
      userAddress.address.length === 0
    ) {
      console.log("Address not found");
      return res.status(404).send("Address not found");
    }

    // Render the edit-address page with the found address details
    res.render("edit-address", { address: userAddress.address[0] });
  } catch (error) {
    console.log("Error loading edit address page", error);
    res.status(400).send("Error loading the edit profile page");
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.addressId;
    // console.log(userId);

    const {
      name,
      phone,
      pincode,
      locality,
      city,
      state,
      addressType,
      alternative,
      landmark,
      isActive,
    } = req.body;

    if (
      !name ||
      !phone ||
      !pincode ||
      !locality ||
      !city ||
      !state ||
      !addressType
    ) {
      return res.status(400).send("All fields are required");
    }

    // Update the specific address in the address array
    const updatedAddress = await Address.updateOne(
      { userId, "address._id": addressId },
      {
        $set: {
          "address.$.name": name,
          "address.$.phone": phone,
          "address.$.pincode": pincode,
          "address.$.locality": locality,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.addressType": addressType,
          "address.$.altPhone": alternative,
          "address.$.landmark": landmark,
          "address.$.isActive": isActive || false,
        },
      }
    );

    if (isActive) {
      // Retrieve the user's document
      const addressDoc = await Address.findOne({ userId });

      if (addressDoc) {
        // Modify the `isActive` field for all other addresses
        addressDoc.address.forEach((address) => {
          if (address._id.toString() !== addressId) {
            address.isActive = false;
          }
        });

        // Save the updated document
        await addressDoc.save();
      }
    } else {
      const addressDoc = await Address.findOne({ userId });
      if (addressDoc) {
        const activeAddress = addressDoc.address.find(
          (address) => address.isActive
        );

        if (!activeAddress && addressDoc.address.length > 0) {
          const lastAddedAddress =
            addressDoc.address[addressDoc.address.length - 1];

          await Address.updateOne(
            { userId, "address._id": lastAddedAddress._id },
            { $set: { "address.$.isActive": true } }
          );
        }

        // Save the updated document
      }
    }

    if (updatedAddress.nModified === 0) {
      console.log("Address update failed");
      return res.status(400).send("Address update failed");
    }

    res.redirect("/checkout");
    console.log("Address updated successfully");
  } catch (error) {
    console.error("Error updating the address:", error);
    res.status(500).send("Internal Server Error");
  }
};
const getCheckout = async (req, res) => {
  try {
      const user = req.session.user;
      const userId = req.session.user._id;

      // Fetch the user's cart and populate product and category details
      let cart = await Cart.findOne({ userId }).populate({
          path: 'items.productId',
          populate: { path: 'category', model: 'Category' } // Assuming you have a category model
      });

      if (!cart) {
          return res.status(404).redirect('/cart'); // Redirect to cart if no cart found
      }

      let total = 0;
      let totalOfferDiscount = 0;

      // Calculate the total price and discounts for each item in the cart
      cart.items = cart.items.filter(item => item.productId).map(item => {
          item.totalPrice = item.quantity * item.productId.price; // Calculate totalPrice based on product price

          const productOffer = item.productId.productOffer || 0; // Get product-specific offer
          const categoryOffer = item.productId.category?.categoryOffer || 0; // Get category offer (use optional chaining)
          
          // Use the higher offer between productOffer and categoryOffer
          const effectiveOffer = (productOffer >= categoryOffer) ? productOffer : categoryOffer;
          const offerDiscount = (effectiveOffer * item.price / 100) * item.quantity;

          // Accumulate discount and total
          totalOfferDiscount += offerDiscount;
          total += item.totalPrice - offerDiscount;

          return item;
      });

      // Update the cart total
      cart.total = total;
      await cart.save();

      // Fetch the user's addresses
      const userAddresses = await Address.findOne({ userId }).populate("userId");

      // Handle cases where there are no addresses
      let addresses = userAddresses ? userAddresses.address : [];

      // Sort the addresses to ensure the primary address appears first
      addresses = addresses.sort((a, b) => b.isActive - a.isActive);

      // Fetch available coupons
      const currentDate = new Date();
      const coupon = await Coupon.find({ isListed: true });
      const availableCoupons = coupon.filter(coupon => cart.total >= coupon.minimumPrice && new Date(coupon.expireOn) >= currentDate)
        .map(coupon => {
          coupon.formattedExpireOn = coupon.expireOn.toLocaleDateString();
          return coupon;
        });

      // Render the checkout page with cart items, total, and available coupons
      res.render('checkout', {
          user,
          cartItems: cart.items,
          total: cart.total,
          totalOfferDiscount, // Pass total discount
          addresses,
          cartId: cart._id,
          coupon: availableCoupons,
          
      });
  } catch (error) {
      console.log('Checkout error:', error);
      res.redirect('/page-404'); // Redirect to a 404 page in case of an error
  }
};

const applyCoupon = async (req, res) => {
  try {
      const { couponCode, cartTotal } = req.body;

      // Check if the coupon exists and is listed
      const coupon = await Coupon.findOne({ name: couponCode, isListed: true });
      // console.log("123456",coupon);
      

      if (!coupon) {
          return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }

      // Check if the cart total is greater than or equal to the coupon's minimum price
      if (cartTotal < coupon.minimumPrice) {
          return res.status(400).json({ success: false, message: `Cart total must be at least ₹${coupon.minimumPrice} to apply this coupon` });
      }

      // Apply the coupon and calculate the discount
      const discountAmount = coupon.offerPrice;

      // Return the discount and coupon name
      return res.status(200).json({
          success: true,
          discountAmount,
          couponCode: couponCode,
          message: `Coupon applied successfully! You saved ₹${discountAmount}.`
      });
  } catch (error) {
      console.error('Error applying coupon:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) {
      return res.status(400).json({ message: "User not found" });
    }

    const { addressId, cartId, paymentMethod, paymentId, razorpayOrderId, signature, couponCode, paymentStatus } = req.body;

    // Fetch the cart and address
    const cart = await Cart.findById(cartId).populate({
      path: 'items.productId',
      populate: { path: 'category', model: 'Category' }
    });
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

    const address = addressDocument.address[0];

    // Calculate the total price and discount for each item
    let total = 0;
    let totalOfferDiscount = 0;

    cart.items = cart.items.filter(item => item.productId).map(item => {
      item.totalPrice = item.quantity * item.productId.price;

      const productOffer = item.productId.productOffer || 0;
      const categoryOffer = item.productId.category?.categoryOffer || 0;

      const effectiveOffer = (productOffer >= categoryOffer) ? productOffer : categoryOffer;
      const offerDiscount = (effectiveOffer * item.productId.price / 100) * item.quantity;

      totalOfferDiscount += offerDiscount;
      // console.log(totalOfferDiscount,"=========1234456787654");
      
      total += item.totalPrice;
      return item;
    });

    let finalAmount = total;

    // Apply coupon if provided
    let couponApplied = false;
    let discount = totalOfferDiscount;

    if (couponCode) {
      const coupon = await Coupon.findOne({ name: couponCode, isListed: true });
      if (coupon && finalAmount >= coupon.minimumPrice) {
        couponApplied = true;

        if (coupon.offerPrice) {
          discount += coupon.offerPrice;
          discount = discount > 0 ? discount : 0;
        }
        
      }
     
    }
    finalAmount -= discount;
   
    

    const finalAmountAfterCoupon = finalAmount;

    // Generate a custom numeric orderId
    const generateNumericUuid = (length = 16) => {
      const uuid = uuidv4().replace(/\D/g, '').slice(0, length);
      return `#${uuid}`;
    };
    const numericUuid = generateNumericUuid(16);

    // Set the payment status based on the method and status
    const orderPaymentStatus = paymentMethod === 'online-payment' && paymentStatus === 'failed' ? 'Pending' : 'Paid';

    // Create the order
    const newOrder = new Order({
      userId,
      orderId: numericUuid,
      orderItems: cart.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      })),
      totalPrice: cart.total,
      discount: discount, // Total discount applied
      finalAmount: finalAmountAfterCoupon,
      status: "Pending", // Initially set to Pending
      paymentMethod,
      paymentStatus: orderPaymentStatus, // Update status based on success or failure
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
      },
      paymentDetails: {
        paymentId,
        razorpayOrderId,
        signature
      },
      couponApplied,
      couponCode: couponApplied ? couponCode : null, // Store coupon code if applied
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    // Clear the cart after placing the order
    await Cart.findByIdAndDelete(cartId);

    // Update the product quantities
    for (const item of savedOrder.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity -= item.quantity;  // Decrease the product quantity
        await product.save();
      }
    }

    // Return the saved order ID to the frontend
    res.json({ success: true, orderId: savedOrder._id });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "An error occurred while placing the order." });
  }
};

const createOrder = async (req, res) => {
  try {
      const { amount, cartId, couponCode } = req.body;

      // Fetch the cart and calculate the total price and discounts
      const cart = await Cart.findById(cartId).populate({
        path: 'items.productId',
        populate: { path: 'category', model: 'Category' }
      });
      if (!cart) {
        return res.status(400).json({ message: "Invalid cart" });
      }

      let total = 0;
      let totalOfferDiscount = 0;

      // Calculate total and offer discounts for items
      cart.items = cart.items.filter(item => item.productId).map(item => {
        item.totalPrice = item.quantity * item.productId.price;

        const productOffer = item.productId.productOffer || 0;
        const categoryOffer = item.productId.category?.categoryOffer || 0;

        const effectiveOffer = (productOffer >= categoryOffer) ? productOffer : categoryOffer;
        const offerDiscount = (effectiveOffer * item.productId.price / 100) * item.quantity;

        totalOfferDiscount += offerDiscount;
        total += item.totalPrice - offerDiscount;

        return item;
      });

      let finalAmount = total;  // Initial total before applying coupon
      let couponApplied = false;
      let discount = 0;
      // console.log("111111111111",finalAmount);
      

      // Apply coupon if provided
      if (couponCode) {
        const coupon = await Coupon.findOne({ name: couponCode, isListed: true });
        // console.log('coupon',coupon);
        

        if (coupon && coupon.isListed && finalAmount >= coupon.minimumPrice) {
          couponApplied = true;  // Set couponApplied to true

          if (coupon.offerPrice) {
            discount = coupon.offerPrice;
          } 
          finalAmount -= discount;  // Update final amount after discount
          // console.log("finalamount",finalAmount);
          
        }
      }

      // Ensure the amount is in paisa (integer) for Razorpay by multiplying by 100
      const options = {
        amount: Math.round(finalAmount * 100),  // Pass the final amount after coupon
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
        payment_capture: 1
      };
      // console.log('options........',options);
      

      // Create the Razorpay order
      const razorpayOrder = await razorpay.orders.create(options);

      // Send the Razorpay order details to the frontend
      res.json({
        success: true,
        order: razorpayOrder,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        user: req.session.user.name,
        couponApplied,  // Send couponApplied status to the frontend
        discount  // Send discount applied, if any
      });
  } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
  }
};

const initiateRepayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the existing order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    // Send the Razorpay key and required details to frontend
    res.json({
      success: true,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      order
    });
  } catch (error) {
    console.error('Error initiating repayment:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate repayment' });
  }
};
const verifyRepayment = async (req, res) => {
  try {
    const { paymentId, razorpayOrderId, signature, orderId } = req.body;

    // Log the incoming data for debugging
    console.log('Received data from frontend:', req.body);

    // Find the existing order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify Razorpay signature to confirm payment
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + paymentId)
      .digest('hex');
    console.log("Generated Signature:", generatedSignature);

    if (generatedSignature === signature) {
      return res.json({ success: false, message: 'Payment verification failed' });
    }

    // Update order payment status to 'Paid'
    order.paymentStatus = 'Paid';
    order.razorpay = { paymentId, razorpayOrderId, signature };

    await order.save();

    res.json({ success: true, message: 'Payment verified successfully!' });
  } catch (error) {
    console.error('Error verifying repayment:', error);
    res.status(500).json({ success: false, message: 'Error verifying repayment' });
  }
};






const verifyPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature,razorpayOrderId } = req.body;
        
        
        const order = await Order.findOne({ _id: orderId });
        // console.log('order in payment success', order)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
       

        // Verify the signature to ensure payment is legit
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + paymentId)
            .digest('hex');
           
            

        if (generatedSignature === signature) {
          order.paymentStatus = 'Paid';
          order.razorpay = {
              paymentId,
              razorpayOrderId: razorpayOrderId
          };
          await order.save();
           

            res.json({ success: true,orderId:razorpayOrderId, message: 'Payment verified successfully!' });
        } else {
            res.json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
};


module.exports = {

getManageAddress,
addAddress,
loadAddAddress,
editAddress,
updateAddress,
getCheckout,
applyCoupon,
placeOrder,
verifyPayment,
createOrder,
initiateRepayment,
verifyRepayment

}
