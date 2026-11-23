const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const auth = require("../middleware/auth");
const { isReviewer } = require("../middleware/role");

router.get("/assigned", auth, isReviewer, reviewController.getAssignedPapers);
router.post("/", auth, isReviewer, reviewController.submitReview);
router.get("/history", auth, isReviewer, reviewController.getReviewHistory);
router.get("/paper/:paperId", auth, reviewController.getPaperReviews);

module.exports = router;
