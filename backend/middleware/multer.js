const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./localUploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    }
});

const allowedMimeTypes = [
    // 🖼️ Images
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // 🎵 Audio
    'audio/mpeg',  // .mp3
    'audio/wav',   // .wav
    'audio/ogg',   // .ogg
    'audio/aac',   // .aac

    // 🎥 Video
    'video/mp4',   // .mp4
    'video/webm',  // .webm
    'video/x-msvideo', // .avi
    'video/mpeg',  // .mpeg

    // 📄 Documents & Spreadsheets
    'application/pdf', // .pdf
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
];


const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const err = new Error("Invalid file type!");
            err.status = 400;
            cb(err, false);
        }
    }
});

module.exports = { upload };