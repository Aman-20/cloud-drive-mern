const { getUser } = require("../service/jwt");
const { User } = require("../model/user");

async function CheckUserAuth(req, res, next) {
    try {
        const token = req.cookies.uid;
        if (!token) {
            return res.status(401).json({ success: false, msg: "no token provided" });
        }

        const verifyToken = getUser(token);
        if (!verifyToken) {
            return res.status(401).json({ success: false, msg: "token expired" });
        }

        //check database for password reset
        const user = await User.findById(verifyToken._id);
        if (!user) {
            return res.status(401).json({ success: false, msg: "user not found" });
        }
        if (user.passwordChangedAt && verifyToken.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
            return res.status(401).json({ success: false, msg: "Please log in again" });
        }

        req.user = verifyToken;
        return next();
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
}

module.exports = { CheckUserAuth };