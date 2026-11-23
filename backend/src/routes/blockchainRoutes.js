const express = require("express");
const router = express.Router();
const blockchainController = require("../controllers/blockchainController");
const upload = require("../middleware/upload");

router.post("/verify-paper", blockchainController.verifyPaper);
router.post("/verify-file", upload.single("file"), blockchainController.verifyFile);
router.get("/record/:paperId", blockchainController.getRecord);
router.get("/events", blockchainController.getEvents);

module.exports = router;
