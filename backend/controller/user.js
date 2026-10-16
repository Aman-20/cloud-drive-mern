const { User } = require("../model/user");
const { hashUserPass, verifyUserPass } = require("../service/hashPass");
const { setUser, getUser } = require("../service/jwt");

const { Otp } = require("../model/otp");
const { generateOtp, generateLink } = require("../service/generate");
const { sendOtp, sendLink } = require("../service/mailer");

const { checkLimit, readOnlyLimit } = require("../middleware/resendlimit")

//Limites Here
const OTP_EXPIRY = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const LOGIN_ATTEMPT = 5;


async function handleSignup(req, res) {
    try {
        const { name, email, password } = req.body;

        const checkUser = await User.findOne({ email });

        if (checkUser && checkUser.isVerified) {
            return res.json({ success: false, msg: "user already exist" });
        }

        const hash = await hashUserPass(password);


        if (checkUser) {
            //read limit only 
            if (!readOnlyLimit(checkUser, "otpLimit")) {
                return res.json({ success: false, msg: "Too many attempts. Try again later!" });
            }

            //check for otp cooldown limit 
            const otp = await Otp.findOne({ email, purpose: "email_verify" });
            if (otp) {
                const time = Date.now() - otp.sentAt;
                if (time < RESEND_COOLDOWN_MS) {
                    const timeMs = RESEND_COOLDOWN_MS - time;
                    return res.json({ success: false, msg: `Please wait ${Math.ceil(timeMs / 1000)}s before requesting again` })
                }
            }

            //check for user otp limit and increase or reset the count 
            const allowed = await checkLimit(checkUser, "otpLimit");
            if (!allowed) {
                return res.json({ success: false, msg: "Too many attempts. Try again later!" });
            }

            checkUser.name = name;
            checkUser.pass = hash;
            await checkUser.save();
        } else {
            await User.create({
                name,
                email,
                pass: hash,
            });
        }

        const newOtp = generateOtp();

        await Otp.findOneAndUpdate({ email, purpose: "email_verify" }, { code: newOtp, expiresAt: new Date(Date.now() + OTP_EXPIRY), attempts: 0, sentAt: new Date() }, { upsert: true, returnDocument: 'after' });

        await sendOtp(email, newOtp);

        return res.json({ success: true, msg: "Otp Sent Successfully" });

    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};


async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;

        const record = await Otp.findOne({ email, purpose: "email_verify" });
        if (!record) {
            return res.json({ success: false, msg: "OTP expired. Please request a new one" });
        }

        if (record.expiresAt < Date.now()) {
            await Otp.deleteOne({ _id: record._id });
            return res.json({ success: false, msg: "OTP expired. Please request a new one" });
        }

        if (record.attempts >= MAX_ATTEMPTS) {
            await Otp.deleteOne({ _id: record._id });
            return res.json({ success: false, msg: "Too many attempts. Please request a new OTP" });
        }

        if (record.code !== String(otp)) {
            record.attempts += 1;

            if (record.attempts >= MAX_ATTEMPTS) {
                await Otp.deleteOne({ _id: record._id });
                return res.json({ success: false, msg: "Too many attempts. Please request a new OTP" });
            }

            await record.save();
            return res.json({ success: false, msg: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempts left` });
        }

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { returnDocument: 'after' });

        await Otp.deleteOne({ _id: record._id });

        const token = setUser(user);
        res.cookie("uid", token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: true, //false
            sameSite: "none", //lax
        });

        return res.json({ success: true, msg: "Email verified successfully" });

    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }

}


async function resendOtp(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, msg: "User not found" });
        }

        if (user.isVerified) {
            return res.json({ success: false, msg: "Email already verified" });
        }


        //read only otp limit 
        if (!readOnlyLimit(user, "otpLimit")) {
            return res.json({ success: false, msg: "Too many attempts. Try again later!" });
        }

        //otp cooldown
        const otp = await Otp.findOne({ email, purpose: "email_verify" });
        if (otp && Date.now() - otp.sentAt < RESEND_COOLDOWN_MS) {
            const timeMs = RESEND_COOLDOWN_MS - (Date.now() - otp.sentAt);
            return res.json({ success: false, msg: `Please wait ${Math.ceil(timeMs / 1000)}s before requesting again` });
        }

        //change otp limit before sending again 
        const allowed = await checkLimit(user, "otpLimit");
        if (!allowed) {
            return res.json({ success: false, msg: "Too many attempts. Try again later!" });
        }

        const newOtp = generateOtp();

        await Otp.findOneAndUpdate({ email, purpose: "email_verify" }, { code: newOtp, expiresAt: new Date(Date.now() + OTP_EXPIRY), attempts: 0, sentAt: new Date() }, { upsert: true, returnDocument: 'after' });

        await sendOtp(email, newOtp);

        res.json({ success: true, msg: "New OTP sent to your email" });

    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
}


async function handleLogin(req, res) {
    const { email, password } = req.body;

    const verifyUser = await User.findOne({ email });
    if (!verifyUser) {
        return res.json({ success: false, msg: "user does not exist" });
    }

    if (!verifyUser.isVerified) {
        return res.json({ success: false, msg: "Please verify your email first" });
    }

    //read only login limit before matching password
    if (!readOnlyLimit(verifyUser, "loginLimit", LOGIN_ATTEMPT)) {
        return res.json({ success: false, msg: "Too many attempts. Try again later!" });
    }

    const verifyPass = await verifyUserPass(password, verifyUser.pass);
    if (!verifyPass) {
        //count login attempt if password does not match! 
        const allowed = await checkLimit(verifyUser, "loginLimit", LOGIN_ATTEMPT);
        if (!allowed) {
            return res.json({ success: false, msg: "Too many attempts. Try again later!" });
        }
        return res.json({ success: false, msg: "Invalid email or password" });
    }

    //reset login attempt count after successfull login
    verifyUser.loginLimit.count = 0;
    verifyUser.loginLimit.windowStart = null;
    await verifyUser.save();


    const token = setUser(verifyUser);
    res.cookie("uid", token, {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        secure: true, //false
        sameSite: "none", //lax
    });

    return res.json({ success: true, msg: "Your are logged in" });
};


async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, msg: "User does not exist" });
        }

        if(!user.isVerified){
            return res.json({ success: false, msg: "User does not exist" });
        }

        //read only reset 
        if (!readOnlyLimit(user, "resetLimit")) {
            return res.json({ success: false, msg: "Too many attempts. Try again later!" });
        }

        //reset link cooldown 
        const otp = await Otp.findOne({ email, purpose: "pass_reset" });
        if (otp) {
            const time = Date.now() - otp.sentAt;
            if (time < RESEND_COOLDOWN_MS) {
                const timeMs = RESEND_COOLDOWN_MS - time;
                return res.json({ success: false, msg: `Please wait ${Math.ceil(timeMs / 1000)}s before requesting again` })
            }
        }

        //change reset limit before sending
        const allowed = await checkLimit(user, "resetLimit");
        if (!allowed) {
            return res.json({ success: false, msg: "Too many attempts. Try again later!" });
        }

        const token = generateLink();
        await Otp.findOneAndUpdate({ email, purpose: "pass_reset" }, { code: token, expiresAt: Date.now() + OTP_EXPIRY, attempts: 0, sentAt: new Date() }, { upsert: true, returnDocument: 'after' });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        await sendLink(email, resetLink);

        res.json({ success: true, msg: "a reset link has been sent" });

    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};


async function resetPassword(req, res) {
    try {
        const {token, newPass } = req.body;

        const record = await Otp.findOne({ code:token, purpose: "pass_reset" });

        if (!record) {
            return res.json({ success: false, msg: "Invalid or expired reset link" });
        }

        if (record.expiresAt < Date.now()) {
            return res.json({ success: false, msg: "Reset link expired. Please request a new one" });
        }

        const hashPass = await hashUserPass(newPass);

        await User.findOneAndUpdate({ email:record.email }, { pass: hashPass, passwordChangedAt: new Date() });

        await Otp.deleteOne({ _id: record._id });

        res.json({ success: true, msg: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
}


async function handleLogout(req, res) {
    try {
        res.clearCookie("uid", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        return res.status(200).json({ success: true, msg: "cookie cleared" });
    } catch (err) {
        return res.status(500).json({ success: false, msg: "unable to delete cookie" });
    }
}

module.exports = { handleLogin, handleSignup, handleLogout, verifyOtp, resendOtp, forgotPassword, resetPassword };