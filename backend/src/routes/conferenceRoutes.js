const express = require("express");
const router = express.Router();
const conferenceController = require("../controllers/conferenceController");
const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");

router.get("/", auth, conferenceController.getConferences);
router.post("/", auth, isAdmin, conferenceController.createConference);

module.exports = router;
