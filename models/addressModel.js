const mongoose = require('mongoose');
const {Schema} = mongoose;
const addressSchema = mongoose.Schema({
    userId: {
        type:Schema.Types.ObjectId,
        ref:"User" ,
        required:true
    },
    address: [{
       addressType:{
        type:String,
        required:false
    },
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

}]
    
})

const Address = mongoose.model('Address',addressSchema);
module.exports = Address;