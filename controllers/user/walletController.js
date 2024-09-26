const User = require('../../models/userModel')
const Order = require('../../models/orderModel')
const Wallet = require('../../models/walletModel')

const loadWalletPage = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.session.user._id }); 
        if (!wallet) {
            wallet = new Wallet({
                userId: req.session.user._id,
                balance: 0,
                transactions: [] 
            });
            await wallet.save();
        }else{
            wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
        }
        res.render('wallet', {
            wallet,
            transactions: wallet.transactions
        }); 
    } catch (error) {
        console.log('Error while loading wallet page', error);
        res.redirect("/pageNotfound")
    }
}

module.exports = {
    loadWalletPage
}