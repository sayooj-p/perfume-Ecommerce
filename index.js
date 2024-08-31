const path = require('path');
const mongoose = require("mongoose");
const express = require("express");
const cartCountMiddleware = require('./middlware/cartCount');
const app = express();
require('dotenv').config();
const session = require('express-session');


mongoose.connect("mongodb://127.0.0.1:27017/perfum_ecomerce")
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error: ", err);
  });


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000
    }
  }));

app.use(express.static(path.join(__dirname, 'public')));
// console.log(path.join(__dirname, 'public'));

app.use(cartCountMiddleware); 


const userRoute = require('./routers/userRoute');
app.use('/', userRoute);

const adminRoute = require("./routers/adminRoute");
app.use('/admin',adminRoute);



const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`server is connected ${PORT}`);
});
