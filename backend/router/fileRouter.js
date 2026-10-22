const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/multer");
const fs = require("fs");

const cloudinary = require("../config/cloudinary");

router.get("/", (req, res) => {
    res.send("file route is working..");
});

router.post("/upload", upload.single("avatar"), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ success: false, msg: "no file present!" });
    }

    try {
        const { fileTypeFromFile } = await import("file-type");
        const type = await fileTypeFromFile(file.path);

        if (!type) {
            return res.status(400).json({ msg: "the uploaded type is not valid" });
        }

        const result = await cloudinary.uploader.upload(file.path, {
            folder: "clouddrive",
            resource_type: "auto",
        });

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
        });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ success: false, msg: "file upload failed" });
    } finally {
        await fs.promises.unlink(file.path).catch((err) => { console.log(err) });
    }
})

router.post("/upload-multiple", upload.array("avatar", 5), async (req, res) => {
    const files = req.files || [];
    if (!files || files.length === 0) {
        return res.status(400).json({ msg: "No files uploaded" });
    }

    try {
        const { fileTypeFromFile } = await import("file-type");

        const results = await Promise.all(files.map(async (file) => {
            try {
                const type = await fileTypeFromFile(file.path);
                if (!type) {
                    return {
                        name: file.originalname,
                        success: false,
                        msg: "Invalid file type"
                    };
                }

                const result = await cloudinary.uploader.upload(file.path, {
                    folder: "clouddrive",
                    resource_type: "auto",
                })

                // return the result
                return {
                    name: file.originalname,
                    success: true,
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                    format: result.format,
                    bytes: result.bytes
                }
            } catch (err) {
                return {
                    name: file.originalname,
                    success: false,
                    error: err.message
                };
            } finally {
                await fs.promises.unlink(file.path).catch(() => { });
            }
        }));

        const count = results.filter((f) => f.success).length;

        return res.status(count > 0 ? 200 : 400).json({
            success: count > 0,
            count,
            failed: results.length - count,
            results,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, msg: "Failed to process uploads" });
    }
})

module.exports = router;