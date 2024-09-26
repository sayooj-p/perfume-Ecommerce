const mongoose = require('mongoose');
const {Schema} = mongoose;
const cartSchema = mongoose.Schema({
    userId: {
        type:Schema.Types.ObjectId,
        ref:"User" ,
        required:true
    },
    items:[ {
        productId: {
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true

        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true
        },

    }],
    total: Number,
  coupon: {
    code: { type: String, default: null },  // Store coupon code
    discount: { type: Number, default: 0 }, // Store discount amount
  }

    
})
const Cart = mongoose.model('Cart',cartSchema);
module.exports = Cart;

