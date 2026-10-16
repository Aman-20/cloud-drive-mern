const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;


async function sendOtp(to, otp) {
    const { data, error } = await resend.emails.send({
        from: FROM,
        to,
        subject: "Verify your email",
        html: `<p>Your OTP is <strong>${otp}</strong></p>`,
    });

    if (error) {
        throw new Error(`Failed to send OTP email: ${error.message}`);
    }
    return data;
}


async function sendLink(to, link) {
    const { data, error } = await resend.emails.send({
        from: FROM,
        to,
        subject: "Reset password",
        html: `<p>Reset your password</p><a href="${link}">${link}</a>`,
    });

    if (error) {
        throw new Error(`Failed to send reset link: ${error.message}`);
    }
    return data;
}


module.exports = { sendOtp, sendLink };