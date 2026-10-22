
const multer = require("multer");

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError || err.status === 400) {
        return res.status(400).json({ success: false, msg: err.message });
    }

    // Unexpected errors
    console.error(err);

    return res.status(500).json({success: false, msg: err.message || "Internal server error",});
}

module.exports = errorHandler;
