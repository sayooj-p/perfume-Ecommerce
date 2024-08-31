const User = require('../models/userModel');

const userAuth = (req, res, next) => {
    
    if (req.session.user) {
        User.findById(req.session.user._id)
            .then(data => {
                if (data && !data.is_blocked) {
                    next();
                }else if(data.is_blocked){
                    req.session.destroy((err) => {
                        if (err) {
                            console.log("Session destruction error", err.message)
                            return res.redirect("/pageNotfound")
                        }
                        return res.redirect('/login?blocked')
                    })
                }else {
                    res.redirect('/login')
                } 
            }) 
            .catch(error => {
                console.log("Error in user auth middleware", error)
                res.redirect("/pageNotfound")
            })

    } else {
        res.redirect('/login')
    }
}


module.exports = userAuth ;
    
