const User = require('../../models/userModel');
const mongoose = require('mongoose');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const Category = require('../../models/categoryModel');
const Order = require('../../models/orderModel');
const moment = require('moment');

const loadLogin = async (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin');
    }
    res.render('login', { message: null });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, is_admin: true });
        if (admin) {
            const passwordHash = await bcrypt.compare(password, admin.password);
            if (passwordHash) {
                req.session.admin = true;
                return res.redirect('/admin');
            } else {
                return res.redirect('/admin/login');
            }
        } else {
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.log("login failed", error);
        return res.redirect('/pageError');
    }
};

const loadDashboard = async (req, res) => {
    try {
        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        // Apply filter based on filterType
        switch (filterType) {
            case 'daily':
                filter.createdOn = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdOn = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdOn = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdOn = {
                        $gte: startDate,
                        $lt: endDate,
                    };
                }
                break;
            default:
                break;
        }

        // Aggregations for total sales, discounts, and counts
        const overallOrderAmount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalAmount: { $sum: "$finalAmount" } } }
        ]);

        const overallDiscount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalDiscount: { $sum: "$discount" } } }
        ]);

        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
        const salesCount = await Order.countDocuments(filter);

        // Fetch all sales data for the line chart (salesReport)
        const salesReport = await Order.find(filter).select('createdOn finalAmount discount');

        // Order status mapping
        const orderStatusCounts = await Order.aggregate([
            { $match: filter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const orderStatusMap = {
            Processing: 0,
            Shipped: 0,
            Delivered: 0,
            Cancelled: 0,
            'Return Request': 0,
            Returned: 0
        };
        orderStatusCounts.forEach(status => {
            orderStatusMap[status._id] = status.count;
        });

        // Top 5 Best-Selling Products
        const topProducts = await Order.aggregate([
            { $match: filter },
            { $unwind: "$orderItems" },
            { $group: { _id: "$orderItems.product", totalSold: { $sum: "$orderItems.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $project: { productName: "$product.productName", totalSold: 1 } }
        ]);

        // Top 5 Best-Selling Categories
        const topCategories = await Order.aggregate([
            { $match: filter },
            { $unwind: "$orderItems" },
            { $lookup: { from: "products", localField: "orderItems.product", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            { $group: { _id: "$productDetails.category", totalSold: { $sum: "$orderItems.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
            { $unwind: "$category" },
            { $project: { categoryName: "$category.name", totalSold: 1 } }
        ]);

        // Render the dashboard with all the necessary data
        res.render('dashboard', {
            salesCount,
            totalAmount,
            totalDiscount,
            salesReport, // <-- Pass salesReport here
            filterType,
            startDate,
            endDate,
            orderStatusMap,
            topProducts,
            topCategories,
        });
    } catch (error) {
        console.log("Error loading Dashboard", error);
        res.redirect("/admin/pageError");
    }
};

const logout = async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("erro destroying admin,err");
                return res.redirect('/pageError')
                
            }
            res.redirect('/admin/login');
        })
    } catch (error) {
        console.log('unexpected error during logout',error);
        res.redirect('/pageError');
        
    }
    
};
module.exports = {
    loadLogin,
    login,
    loadDashboard,
    logout
    
};
