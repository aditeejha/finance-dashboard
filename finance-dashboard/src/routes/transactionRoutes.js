const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { authenticate, authorize } = require("../middleware/auth");
const { transactionValidator, transactionQueryValidator } = require("../middleware/validators");

// All transaction routes require authentication
router.use(authenticate);

// Viewers, analysts, and admins can read transactions
router.get("/", transactionQueryValidator, transactionController.getAllTransactions);
router.get("/:id", transactionController.getTransactionById);

// Only admins can create, update, or delete transactions
router.post("/", authorize("admin"), transactionValidator, transactionController.createTransaction);
router.put("/:id", authorize("admin"), transactionValidator, transactionController.updateTransaction);
router.delete("/:id", authorize("admin"), transactionController.deleteTransaction);

module.exports = router;
