const User = require("../../models/userModel");
const Product = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const Cart = require("../../models/cartModel");



const getShop = async (req, res) => {
    try {
        // Extract query parameters (with defaults)
        const user = req.session.user;
        const { page = 1, category, search, sort = 'createdAt', order = 'desc' } = req.query;
        const limit = 6;  // Number of products per page
        const skip = (page - 1) * limit;

        // Initialize query object to filter products
        let query = { isBlocked: false };
        const searchQuery = search || '';
        const categoryFilter = category || '';

        // Add search condition if search query exists
        if (searchQuery) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }

        // Add category condition if category filter is selected
        if (categoryFilter) {
            query.category = categoryFilter;
        }

        // Define sorting criteria (e.g., sorting by productName or price)
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortCriteria = {};
        sortCriteria[sort] = sortOrder;

        // Fetch the total number of products that match the query (for pagination purposes)
        const totalProducts = await Product.countDocuments(query);

        // Fetch the sorted and paginated products
        const products = await Product.find(query)
            .populate("category", "name")
            .sort(sortCriteria)  // Apply global sorting based on user selection
            .skip(skip)           // Pagination: skip the products for previous pages
            .limit(limit);        // Limit: restrict the number of products per page

        // Fetch all categories for the filtering sidebar
        const categories = await Category.find({ isListed: false });

        // Handle cart product IDs if the user is logged in
        let cartProductIds = [];
        if (user) {
            const userData = await User.findOne({ _id: user });
            const cart = await Cart.findOne({ userId: userData._id });
            if (cart) {
                cartProductIds = cart.items.map(item => item.productId.toString());
            }
        }

        // Render the shop page with sorted and paginated products
        res.render("shop", {
            user: user ? await User.findOne({ _id: user }) : null,
            products,                // Sorted and paginated products
            cartProductIds,          // Products in the user's cart
            categories,              // Available categories for filtering
            sort,                    // Current sorting criteria
            order,                   // Current sorting order (asc/desc)
            currentPage: parseInt(page),  // Current page number
            totalPages: Math.ceil(totalProducts / limit),  // Total pages
            categoryFilter,          // Selected category filter
            searchQuery              // Current search query
        });
    } catch (error) {
        console.error("Error showing shop page", error);
        res.status(500).send("Internal server error");
    }
};



module.exports = {
    getShop,
};


