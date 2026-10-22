const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/multer");
const { CheckUserAuth } = require("../middleware/checkAuth");
const {
    uploadFile,
    uploadMultiple,
    getMyFiles,
    deleteFile,
    deleteMultiple,
} = require("../controller/file");

router.use(CheckUserAuth);

router.get("/", (req, res) => res.send("file route is working.."));

router.get("/my-files", getMyFiles);

router.post("/upload", upload.single("avatar"), uploadFile);
router.post("/upload-multiple", upload.array("avatar", 5), uploadMultiple);

router.post("/delete-multiple", deleteMultiple);
router.delete("/:id", deleteFile);

module.exports = router;