const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true 
    },
    originalName: { 
        type: String, 
        required: true 
    },
    url: { 
        type: String, 
        required: true 
    },
    publicId: { 
        type: String, 
        required: true 
    },
    resourceType: { 
        type: String, 
        enum: ["image", "video", "raw"], 
        required: true 
    },
    format: { 
        type: String
    },
    mimeType: { 
        type: String 
    },
    bytes: { 
        type: Number 
    },
}, { timestamps: true });

const File = mongoose.model("File", fileSchema);
module.exports = { File };