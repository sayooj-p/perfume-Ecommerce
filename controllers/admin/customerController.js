const User = require('../../models/userModel');

const customerDetails = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 5;
        const userData = await User.find({
            is_admin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.countDocuments({
            is_admin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        });

        res.render('userDetails', {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.log("Error when showing user details", error);
        res.status(500).send("Server Error");
    }
};

const toggleUserBlockStatus = async (req, res) => {
    try {
        let id = req.query.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const newStatus = !user.is_blocked;
        await User.updateOne({ _id: id }, { $set: { is_blocked: newStatus } });
        res.json({ success: true, message: `User ${newStatus ? 'blocked' : 'unblocked'} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user status.' });
    }
};

module.exports = {
    customerDetails,
    toggleUserBlockStatus
};
