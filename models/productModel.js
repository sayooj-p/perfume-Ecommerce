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
        required: true,
        default: 'in Stock'
    },
    category: {
        type:Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
