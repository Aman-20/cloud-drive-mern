const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        enum: ["email_verify", "pass_reset"],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    sentAt: {
        type: Date, 
        default: null,
    },
}, { timestamps: true });


const Otp = mongoose.model("Otp", otpSchema);


module.exports = { Otp };