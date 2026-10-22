const fs = require("fs");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const { File } = require("../model/file");

// ---------- helpers ----------

// validate -> upload to cloudinary -> save in mongo
async function storeFile(file, userId) {
    const { fileTypeFromFile } = await import("file-type");
    const type = await fileTypeFromFile(file.path);
    if (!type) {
        throw Object.assign(new Error("Invalid file type"), { status: 400 });
    }

    const result = await cloudinary.uploader.upload(file.path, {
        folder: `clouddrive/${userId}`,
        resource_type: "auto",
    });

    try {
        return await File.create({
            owner: userId,
            originalName: file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            mimeType: type.mime,
            bytes: result.bytes,
        });
    } catch (err) {
        // DB save failed -> don't leave an orphan in cloudinary
        await cloudinary.uploader
            .destroy(result.public_id, { resource_type: result.resource_type })
            .catch(() => { });
        throw err;
    }
}

const removeLocalFile = (path) => fs.promises.unlink(path).catch(() => { });

// ---------- upload ----------

// POST /file/upload
async function uploadFile(req, res) {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ success: false, msg: "no file present!" });
    }

    try {
        const saved = await storeFile(file, req.user._id);
        res.json({ success: true, file: saved });
    } catch (err) {
        console.log(err);
        res.status(err.status || 400).json({ success: false, msg: err.message || "file upload failed" });
    } finally {
        await removeLocalFile(file.path);
    }
}

// POST /file/upload-multiple
async function uploadMultiple(req, res) {
    const files = req.files || [];
    if (files.length === 0) {
        return res.status(400).json({ success: false, msg: "No files uploaded" });
    }

    try {
        const results = await Promise.all(files.map(async (file) => {
            try {
                const saved = await storeFile(file, req.user._id);
                return { name: file.originalname, success: true, file: saved };
            } catch (err) {
                return { name: file.originalname, success: false, error: err.message };
            } finally {
                await removeLocalFile(file.path);
            }
        }));

        const count = results.filter((f) => f.success).length;
        res.status(count > 0 ? 200 : 400).json({
            success: count > 0,
            count,
            failed: results.length - count,
            results,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: "Failed to process uploads" });
    }
}

// ---------- read ----------

// GET /file/my-files?page=1&limit=20&type=image
async function getMyFiles(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const filter = { owner: req.user._id };
        if (req.query.type) filter.resourceType = req.query.type;

        const [files, total] = await Promise.all([
            File.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            File.countDocuments(filter),
        ]);

        res.json({ success: true, total, page, pages: Math.ceil(total / limit), files });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
}

// ---------- delete ----------

// DELETE /file/:id
async function deleteFile(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, msg: "invalid file id" });
        }

        const file = await File.findOne({ _id: id, owner: req.user._id });
        if (!file) {
            return res.status(404).json({ success: false, msg: "file not found" });
        }

        const result = await cloudinary.uploader.destroy(file.publicId, {
            resource_type: file.resourceType,
            invalidate: true,
        });

        if (result.result !== "ok" && result.result !== "not found") {
            return res.status(502).json({ success: false, msg: "cloudinary delete failed" });
        }

        await file.deleteOne();
        res.json({ success: true, msg: "file deleted" });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
}

// POST /file/delete-multiple   body: { ids: [...] }
async function deleteMultiple(req, res) {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
            return res.status(400).json({ success: false, msg: "ids must be an array of 1-100 items" });
        }
        if (!ids.every((id) => mongoose.isValidObjectId(id))) {
            return res.status(400).json({ success: false, msg: "invalid id in list" });
        }

        const files = await File.find({ _id: { $in: ids }, owner: req.user._id });
        if (files.length === 0) {
            return res.status(404).json({ success: false, msg: "no matching files" });
        }

        // cloudinary bulk delete works per resource_type
        const groups = {};
        for (const f of files) (groups[f.resourceType] ||= []).push(f);

        const deletedDbIds = [];
        const failed = [];

        for (const [resourceType, group] of Object.entries(groups)) {
            try {
                const result = await cloudinary.api.delete_resources(
                    group.map((f) => f.publicId),
                    { resource_type: resourceType, invalidate: true }
                );

                for (const f of group) {
                    const status = result.deleted[f.publicId];
                    if (status === "deleted" || status === "not_found") deletedDbIds.push(f._id);
                    else failed.push(f._id);
                }
            } catch (err) {
                group.forEach((f) => failed.push(f._id));
            }
        }

        await File.deleteMany({ _id: { $in: deletedDbIds }, owner: req.user._id });

        res.status(failed.length ? 207 : 200).json({
            success: deletedDbIds.length > 0,
            deleted: deletedDbIds.length,
            failed: failed.length,
            failedIds: failed,
        });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
}

module.exports = { uploadFile, uploadMultiple, getMyFiles, deleteFile, deleteMultiple };