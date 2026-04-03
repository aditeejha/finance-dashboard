const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");

// All dashboard routes require authentication
// Viewers are excluded — only analyst and admin can access analytics
router.use(authenticate);
router.use(authorize("analyst", "admin"));

router.get("/summary", dashboardController.getSummary);
router.get("/categories", dashboardController.getCategoryBreakdown);
router.get("/trends", dashboardController.getMonthlyTrends);
router.get("/recent", dashboardController.getRecentActivity);

module.exports = router;
