const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");

router.use(auth, isAdmin);

router.get("/overview", adminController.getOverview);
router.get("/users", adminController.getUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.get("/submissions", adminController.getSubmissions);
router.post("/assignments", adminController.assignReviewer);
router.delete("/assignments/:assignmentId", adminController.removeAssignment);
router.post("/decisions", adminController.recordDecision);
router.get("/audit-trail", adminController.getAuditTrail);

module.exports = router;
