const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/multer");
const fs = require("fs");

const cloudinary = require("../config/cloudinary");

router.get("/", (req, res) => {
    res.send("file route is working..");
});

router.post("/upload", upload.single("avatar"), async (req, res) => {
    try {
        const file = req.file;

        const buffer = fs.readFileSync(file.path);
        const { fileTypeFromBuffer } = await import("file-type");
        const type = await fileTypeFromBuffer(buffer);

        console.log("File path:", file.path);
        console.log("Buffer size:", buffer.length);
        console.log("Detected type:", type);
        console.log(buffer.subarray(0, 20));
        console.log("Multer MIME:", file.mimetype);
        console.log("Extension:", file.originalname);

        if (!type) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ msg: "the uploaded type is not valid" });
        }

        const result = await cloudinary.uploader.upload(file.path, {
            folder: "clouddrive",
            resource_type: "auto",
        });

        // res.json({success:true, msg:"file uploaded successfully", mime:type.mime, ext:type.ext});
        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
        });
    } catch (err) {
        return res.json({ success: false, msg: err });
    } finally {
        fs.unlinkSync(file.path);
    }
})

router.post("/upload-multiple", upload.array("avatar", 5), async (req, res) => {
    const files = req.files || [];
    if (!files || files.length === 0) {
        return res.status(400).json({ msg: "No files uploaded" });
    }

    try {
        const { fileTypeFromBuffer } = await import("file-type");

        await Promise.all(files.map(async (file) => {
            // 1) read file using fs
            const buffer = fs.readFileSync(file.path);
            // 2) verify file type 
            const type = await fileTypeFromBuffer(buffer);
            if (!type) {
                const err = new Error(`Invalid file type: ${file.originalname}`);
                err.status = 400;
                throw err;
            }
        }))

        const results = await Promise.all(files.map((file) =>
            cloudinary.uploader.upload(file.path, {
                folder: "clouddrive",
                resource_type: "auto",
            })
        ));

        // 4) return the result
        return res.status(200).json({
            message: "Files uploaded successfully",
            files: results.map((r) => ({
                url: r.secure_url,
                public_id: r.public_id,
                format: r.format,
                size: r.bytes,
            })),
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, msg: "Failed to process files" });
    } finally {

        // 5) delete all local finally 
        await Promise.allSettled(files.map((file) => fs.promises.unlink(file.path)));
    }
})

module.exports = router;