const User = require("../../models/userModel");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartModel");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const nodeMailer = require("nodemailer");
const { session } = require("passport");

const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user;

    const products = await Product.find().populate("category", "name isListed");
    const filteredProducts = products.filter(
      (product) =>
        !product.isBlocked && product.category && !product.category.isListed
    );

    let cartProductIds = [];

    if (user) {
      const userData = await User.findOne({ _id: user });
      // console.log(userData);

      const cart = await Cart.findOne({ userId: userData._id });
      // console.log(cart);

      if (cart) {
        cartProductIds = cart.items.map((item) => item.productId.toString());
      }
      // console.log(cartProductIds);

      res.render("home", {
        // user: userData,
        products: filteredProducts,
        cartProductIds,
      });
    } else {
      res.render("home", {
        user: null,
        products: filteredProducts,
        cartProductIds,
      });
      console.log("user not logged in");
    }
  } catch (error) {
    console.error("Error loading home page:", error);
    res.status(500).send("Server Error");
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log("signup page not found");
    res.status(500).send("Server Error");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sentVerificationEmail(email, otp) {
  try {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify Your Account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.log("Error sending email", error);
    return false;
  }
}

const insertUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, mobile } = req.body;
    if (password !== confirmPassword) {
      res.render("signup", { message: "Passwords do not match." });
      return;
    }
    const findUser = await User.findOne({ email });
    if (findUser) {
      res.render("signup", { message: "User with this Email already exists" });
      return;
    }
    const otp = generateOtp();
    const emailSent = await sentVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error");
    }
    req.session.userOtp = otp;
    req.session.userData = { name, email, password, mobile };
    res.render("verify-otp");
    console.log("OTP sent:", otp);
  } catch (error) {
    console.log("signup Error");
    res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return passwordHash;
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const newUser = {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        password: passwordHash,
      };

      if (user.googleId) {
        newUser.googleId = user.googleId;
      }

      const saveUserData = new User(newUser);
      await saveUserData.save();
      req.session.user = saveUserData._id;
      res.json({
        success: true,
        redirectUrl: "/",
      });
    } else {
      console.log("Error verifying OTP");
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP, please try again" });
    }
  } catch (error) {
    console.log("Error verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "email not found in session" });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sentVerificationEmail(email, otp);
    if (emailSent) {
      console.log("resend otp", otp);
      res
        .status(200)
        .json({ success: true, message: "otp resend successfuly" });
    } else {
      res.status(500).json({
        success: false,
        message: "failed resend otp,please try again",
      });
    }
  } catch (error) {
    console.log("Error resend otp", error);
    res.status(500).json({ success: false, message: "Internal server Error" });
  }
};

const loginLoader = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("/pageNotFound");
    console.log(error.message);
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ is_admin: 0, email: email });
    if (!findUser) {
      return res.render("login", { message: "User not found" });
    }
    if (findUser.is_blocked) {
      return res.render("login", { message: "User is blocked" });
    }
    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("login", { message: "Incorrect Password" });
    }
    req.session.user = findUser;
    res.redirect("/");
    // console.log(req.session.user);
  } catch (error) {
    console.log("login error", error);
    res.render("login", { message: "Login failed, please try again" });
  }
};
const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user;

    // Find the specific product by ID
    const product = await Product.findOne({
      _id: productId,
      isBlocked: false,
    }).populate("category", "name");

    if (!product) {
      return res.redirect("/pageNotFound");
    }

    // Find all related products in the same category (excluding the current product)
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category._id,
      isBlocked: false,
    });

    let cartProductIds = [];

    if (user) {
      const userData = await User.findOne({ _id: user });
      const cart = await Cart.findOne({ userId: userData._id });

      if (cart) {
        cartProductIds = cart.items.map((item) => item.productId.toString());
      }

      res.render("productDetails", {
        user: userData,
        product,
        relatedProducts,
        cartProductIds,
      });
    } else {
      res.render("productDetails", {
        user: null,
        product,
        relatedProducts,
        cartProductIds,
      });
    }
  } catch (error) {
    console.log("Error loading product details:", error);
    res.status(500).send("Server Error");
  }
};


const profileDetails = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("profile", { user: user });
    // console.log(req.session.user.name);
  } catch (error) {
    console.log("error to showing profile Details page", error);
    res.status(500).send("internal server error");
  }
};
const getProfile = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("edit-profile", { user });
  } catch (error) {
    console.log("error to load edit profile page", error);
    res.status(400).send("error to load the edit profile page");
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    // console.log(userId);

    if (userId) {
      const { name, email, mobile } = req.body;

      // Update the user's profile in the database
      const updateProfile = await User.updateOne(
        { _id: userId },
        { $set: { name: name, email: email, mobile: mobile } }
      );

      // if (updateProfile.nModified > 0) {
      // Update the session with the new user details
      req.session.user.name = name;
      req.session.user.email = email;
      req.session.user.mobile = mobile;

      // Redirect to the profile page
      res.redirect("/profile");
      // } else {
      //   console.log("No changes made to the profile.");
      //   res.status(400).send('No changes made to the profile.');
      // }
    } else {
      console.log("Error finding the user.");
      res.status(400).send("Error finding the user.");
    }
  } catch (error) {
    console.log("error in update profile", error);
    res.status(400).send("error in upadate profile");
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("session not destroyed", err.message);
        return res.redirect("/pageNotFound");
      }
      return res.redirect("/");
    });
  } catch (error) {
    console.log("logout error", error);
    res.redirect("/pageNotFound");
  }
};
const getchangePassword = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("change-password", { error: req.query.error || null, user });
  } catch (error) {
    console.log("error showing the change password", error);
    res.status(500).send("Internal Server Error");
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const { oldpassword, newpassword, confirmpassword } = req.body;

    // Find the user by ID or email
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if old password is correct
    const isMatch = await bcrypt.compare(oldpassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    // Check if new passwords match
    if (newpassword !== confirmpassword) {
      return res
        .status(400)
        .json({ success: false, message: "New passwords do not match" });
    }

    // Hash new password and update user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newpassword, salt);

    user.password = hashedPassword;
    await user.save();

    // Respond with success
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const getForgetPassword = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("forget-password", { user });
  } catch (error) {
    console.log("error to load forget password", error);
    res.status(500).send("internal server error");
  }
};
const getOtp = async (req, res) => {
  try {
    // console.log(req.session)
    const email = req.session.user.email;
    const otp = generateOtp();
    const emailSent = await sentVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error");
    }
    req.session.userOtp = otp;
    console.log("OTP sent:", otp);

    res.render("otp-page");
  } catch (error) {
    console.log("error this otp page ", error);
    res.status(500).send("internal server erro");
  }
};

const verifyOtpForgotPassword = async (req, res) => {
  try {
    const { otp } = req.body;
    if (otp === req.session.userOtp) {
      res.json({
        success: true,
        redirectUrl: "/loadResetPassword",
      });
    } else {
      console.log("Error verifying OTP");
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP, please try again" });
    }
  } catch (error) {
    console.log("Error verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const loadResetPassword = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("newForgetPassword", { user });
  } catch (error) {
    console.log("error to load forget password", error);
    res.status(500).send("internal server error");
  }
};

const changeForgotPassword = async (req, res) => {
  try {
    const { confirmpassword } = req.body;
    console.log("body", req.body);

    const user = await User.findOne({ _id: req.session.user._id });

    console.log("old", user);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    console.log("1234");
    console.log("confirmPassword", confirmpassword);
    const passwordHash = await bcrypt.hash(confirmpassword, 10);

    console.log("pass Hash", passwordHash);
    user.password = passwordHash;
    console.log("new", user);

    await user.save();
    console.log("new", user);

    res.json({ success: true, message: "Password Successfully Updated" });
  } catch (error) {
    console.log("error while changing forgot password");
    res.redirect("/pageNotFound");
  }
};
const resendOtpForget = async (req, res) => {
  try {
    const { email } = req.session.user;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "email not found in session" });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sentVerificationEmail(email, otp);
    if (emailSent) {
      console.log("resend otp", otp);
      res
        .status(200)
        .json({ success: true, message: "otp resend successfuly" });
    } else {
      res.status(500).json({
        success: false,
        message: "failed resend otp,please try again",
      });
    }
  } catch (error) {
    console.log("Error resend otp", error);
    res.status(500).json({ success: false, message: "Internal server Error" });
  }
};




module.exports = {
  pageNotFound,
  loadHome,
  loadRegister,
  insertUser,
  verifyOtp,
  securePassword,
  resendOtp,
  loginLoader,
  loadProductDetails,
  login,
  profileDetails,
  logout,
  getProfile,
  updateProfile,
  getchangePassword,
  changePassword,
  getForgetPassword,
  getOtp,
  verifyOtpForgotPassword,
  loadResetPassword,
  changeForgotPassword,
  resendOtpForget,
  
};
