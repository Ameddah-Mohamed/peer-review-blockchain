const express = require("express");
const router = express.Router();
const paperController = require("../controllers/paperController");
const auth = require("../middleware/auth");
const { isAuthor } = require("../middleware/role");
const upload = require("../middleware/upload");

router.get("/my-submissions", auth, isAuthor, paperController.getMySubmissions);
router.post("/", auth, isAuthor, upload.single("file"), paperController.submitPaper);
router.post("/:id/versions", auth, isAuthor, upload.single("file"), paperController.submitVersion);
router.get("/:id", auth, paperController.getPaperById);
router.get("/:id/download", auth, paperController.downloadPaper);
router.get("/:id/versions", auth, paperController.getVersions);

module.exports = router;
