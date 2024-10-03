const passport = require('passport');
const GoogleStrstergy = require('passport-google-oauth20').Strategy;
 const User = require('../models/userModel')
 require('dotenv').config();


// console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
//  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
passport.use(new GoogleStrstergy({
    
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/auth/google/callback'
    
},


async (accessToken,refreshToken,profile,done)=>{
    try {
        let user = await User.findOne({googleId:profile.id}) 
        if(user){
            return done(null,user)
        }else{
            user = new User({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            })
            await user.save();
            return done(null,user)
        }
    } catch (error) {
        return done(error,null)
        
    }
}
));

passport.serializeUser((user,done)=>{
    done(null,user.id)

})
passport.deserializeUser((id,done)=>{
    User.findById(id).then(user=>{
        done(null,user)
    }).catch(err=>{
            done(err,null)
    })
})
module.exports = passport