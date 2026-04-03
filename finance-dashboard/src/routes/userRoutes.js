const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
const { updateUserValidator } = require("../middleware/validators");

// All user routes require authentication
router.use(authenticate);

// Only admins can list all users
router.get("/", authorize("admin"), userController.getAllUsers);

// Any authenticated user can view a user profile
router.get("/:id", userController.getUserById);

// Any authenticated user can update (service handles permission logic)
router.put("/:id", updateUserValidator, userController.updateUser);

// Only admins can deactivate users
router.delete("/:id", authorize("admin"), userController.deleteUser);

module.exports = router;
