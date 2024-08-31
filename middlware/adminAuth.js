const User = require('../models/userModel');


const adminAuth = (req,res,next)=>{
    if(req.session.admin){
    User.findOne({is_admin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect('/admin/login')
        }
       

    })
    .catch(error=>{
        console.log('error in admin auth middlware',error);
        res.status(500).send('internal server error');
        
    })
}else {
    res.redirect('/admin/login')

}
}

module.exports = adminAuth;