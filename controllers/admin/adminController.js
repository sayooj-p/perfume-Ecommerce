const User = require('../../models/userModel');
const mongoose = require('mongoose');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const Category = require('../../models/categoryModel');

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
    if (req.session.admin) {
        try {
            return res.render('dashboard');
        } catch (error) {
            console.log("failed to load dashboard", error);
            return res.redirect('/pageError');
        }
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
