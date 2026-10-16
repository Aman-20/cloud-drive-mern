const rateLimit = require("express-rate-limit");

// general limit for login, OTP verify, reset
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 20,                  
    message: { success: false, msg: "Too many requests. Please try again later." },
});

// stricter limit for routes that send emails
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   
    limit: 10,                
    message: { success: false, msg: "Too many email requests. Please try again in an hour." },
});

module.exports = {authLimiter, emailLimiter};