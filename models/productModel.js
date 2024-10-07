const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    regularPrice:{
        type:Number,

    },
    quantity: {
        type: Number,
        default: 0,
        required: true
    },
    productImage: {
        type: [String],
        required: true
    },
    isBlocked: {
        type: Boolean,
        default:false
    },
    status: {
        type: String,
        enum: ['in Stock', 'out of Stock'],
        required: false,
        default: 'in Stock'
    },
    category: {
        type:Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    },
    productOffer: {
        type:Number,
        default:0
    }
}, { timestamps: true });

productSchema.pre('save', function(next) {
    if (this.quantity === 0) {
        this.status = 'out of Stock';
    } else {
        this.status = 'in Stock';
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
