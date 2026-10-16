const crypto = require("crypto");

function generateOtp(){
    return crypto.randomInt(100000, 1000000).toString();
}


function generateLink(){
    return crypto.randomBytes(32).toString("hex");
}


module.exports = {generateOtp, generateLink};