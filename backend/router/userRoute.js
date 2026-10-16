const express = require("express");
const router = express.Router();

const {handleLogin, handleSignup, handleLogout, verifyOtp, resendOtp, forgotPassword, resetPassword} = require("../controller/user");
const {CheckUserAuth} = require("../middleware/checkAuth");


const {authLimiter, emailLimiter} = require("../middleware/ratelimit");


router.get("/me", CheckUserAuth, (req, res) => {
    res.json({success:true, user:req.user});
});


router.post("/signup", emailLimiter, handleSignup);

router.post("/login", authLimiter, handleLogin);

router.post("/logout", handleLogout);

router.post("/verify-otp", authLimiter, verifyOtp);

router.post("/resend-otp", emailLimiter, resendOtp);

router.post("/forgot-password", emailLimiter, forgotPassword);

router.post("/reset-password", authLimiter, resetPassword);


module.exports = router;