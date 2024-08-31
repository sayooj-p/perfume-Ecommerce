const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: false,
      sparce:true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparce:true,
    },
    mobile: {
      type:String,
      required:false
    },
    googleId: {
      type: String,
      sparce:true
    },
    password: {
      type: String,
      required: false,
    },
    is_blocked: {
      type: Boolean,
      default: false,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
  });
  
  module.exports = mongoose.model("User", userSchema);
  