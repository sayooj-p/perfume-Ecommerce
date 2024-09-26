const mongoose = require('mongoose');
const {Schema} = mongoose;
const {v4:uuidv4} = require('uuid');
const Coupon = require('./couponModel');
const orderSchema = new Schema ({
    orderId:{
        type:String,
        default:()=>uuidv4(), 
        unique:true

        
    },
    userId: {
        type:Schema.Types.ObjectId,
        ref:"User" ,
        required:true
    },
    orderItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0

        }

    }],
    totalPrice:{
        type:Number,
        required:true

    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        name:{
            type:String,
            required:true,
           },
           city: {
            type:String,
            required:true
           },
           landmark: {
            type:String,
            required:false
           },
           state:{
            type:String,
            required:true
           },
           pincode:{
            type:String,
            required:true
           },
           phone: {
            type:String,
            required:true
           },
           altPhone: {
            type:String,
            required:false
           },
           isActive: {
            type:Boolean,
            default:false
           },
           locality:{
                type:String,
                required:true
           }
    
    },
    // invoiceDate:{
    //     type:Date
    // },
    status:{
        type:String,
        required:true,
        enum:['Pending','Processing','Delivered','Cancelled','Return Request','Returned']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true,
        // default:'COD'
        
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Pending','failed'],
        default: 'Pending'
    },
    razorpay: {
        paymentId: { type: String },
        razorpayOrderId: { type: String },
        signature: { type: String }
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    couponCode: {
        type:String,
        

    }
})
const Order = mongoose.model('Order',orderSchema);
module.exports  = Order;