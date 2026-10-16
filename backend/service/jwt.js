const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

function setUser(user){
    try{
        return jwt.sign({
            _id:user._id,
            name:user.name,
            email:user.email
        }, 
        secret,
        { expiresIn: "1h" }
    );
    } catch (err){
        console.log("jwt sign error", err);
    }
}


function getUser(token){
    try{
        return jwt.verify(token, secret);
    } catch(err){
        console.log("jwt token verify error", err);
        return null;
    }
}

module.exports = {setUser, getUser};