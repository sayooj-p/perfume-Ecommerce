const Wishlist = require("../../models/wishListModel");
const Product = require("../../models/productModel");


const getWishList = async (req, res) => {
    try {
        const userId = req.session.user._id;
        let wishList = await Wishlist.findOne({ userId }).populate('products.productId');

        if (!wishList) {
            wishList = await Wishlist.create({ userId, products: [] });
            console.log('Created new wishlist for user');
        }

        res.render('wishList', { wishList });
    } catch (error) {
        console.log('Error loading wishlist page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const addToWishList = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId } = req.body;

        let wishList = await Wishlist.findOne({ userId });
        
        if (!wishList) {
            wishList = await Wishlist.create({ userId, products: [] });
            console.log('Created new wishlist for user');
        }

        // Check if the product is already in the wishlist
        const productExists = wishList.products.some(
            (item) => item.productId.toString() === productId
        );

        if (!productExists) {
            // Only add the product if it doesn't already exist in the wishlist
            wishList.products.push({ productId });
            await wishList.save();
            res.json({ success: true, message: 'Product added to wishlist' });
        } else {
            // Product is already in the wishlist
            res.json({ success: false, message: 'Product is already in your wishlist' });
        }

    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};


const deleteWishList = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.productId;
     
        

        const result = await Wishlist.updateOne(

            { userId },
            { $pull: { products: { productId: productId } } } // Corrected to remove from Wishlist
        );
      
        

        if (result.modifiedCount > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

module.exports = {
    getWishList,
    addToWishList,
    deleteWishList
};










