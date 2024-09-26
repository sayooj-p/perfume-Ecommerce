const User = require('../../models/userModel');
const Coupon = require('../../models/couponModel');

const getCoupon = async (req, res) => {
    try {
        let search = req.query.search || ""; 
        let page = parseInt(req.query.page) || 1;
        const limit = 5;

       
        const coupons = await Coupon.find({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        })
        .sort({ _id: -1 })  
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        // Count the total matching documents for pagination
        const count = await Coupon.countDocuments({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });

        const totalPages = Math.ceil(count / limit);

        // If no coupons are found, return an error message
        if (coupons.length === 0) {
            return res.render('coupon', {
                coupon: [],
                totalPages: 0,
                currentPage: page,
                search: search,
                errorMessage: 'No coupons found matching your search.'
            });
        }

        // Render the coupon page with the list of coupons
        res.render('coupon', {
            coupon: coupons,
            totalPages: totalPages,
            currentPage: page,
            search: search,
            errorMessage: null
        });
    } catch (error) {
        console.log("Error when showing coupon details", error);
        res.status(500).send("Server Error");
    }
};


const loadAddCoupon = (req, res) => {
    try {
        res.render('add-coupon',{});
    } catch (error) {
        console.error('Error loading addCoupon page:', err);
        // res.redirect("/pageError")
    }
};

const addCoupon = async (req, res) => {
    try {
        const { name, minimumPrice, offerPrice, expireOn } = req.body;

        // Ensure that minimumPrice and offerPrice are Numbers and expireOn is a valid Date
        const newCoupon = new Coupon({
            name,
            offerPrice: Number(offerPrice),     
            minimumPrice: Number(minimumPrice), 
            expireOn: new Date(expireOn)     
        });

        await newCoupon.save();
        res.redirect('/coupon');

    } catch (error) {
        console.error("Coupon details not added to the database", error);
        res.status(500).send("Internal server error");
    }
}

const listCoupon = async(req,res)=>{
   
        try {
            let id = req.query.id;
            await Coupon.updateOne({ _id: id }, { $set: { isListed: false } });
            res.redirect('/admin/couponList');
        
        
    } catch (error) {
        console.log("error in list the coupon",error);
        res.status(500).send("Internal server error");   
    }
}

const unlistCoupon = async (req, res) => {
    try {
        let id = req.query.id;
        await Coupon.updateOne({ _id: id }, { $set: { isListed: true } });
        
        res.redirect('/admin/couponList');
    } catch (error) {
        console.log("error", error);
      
    }
};


module.exports = {
    getCoupon,
    loadAddCoupon,
    addCoupon,
    listCoupon,
    unlistCoupon


}