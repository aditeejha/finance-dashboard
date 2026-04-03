const { body, query, param, validationResult } = require("express-validator");

// Reusable helper — run this after any validation chain to catch errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// --- Auth Validators ---
const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin."),
  validate,
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
  validate,
];

// --- User Validators ---
const updateUserValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty."),
  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin."),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive."),
  validate,
];

// --- Transaction Validators ---
const transactionValidator = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number."),
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("date").isDate().withMessage("Date must be a valid date (YYYY-MM-DD)."),
  body("notes").optional().isString(),
  validate,
];

const transactionQueryValidator = [
  query("type").optional().isIn(["income", "expense"]),
  query("startDate").optional().isDate().withMessage("startDate must be YYYY-MM-DD."),
  query("endDate").optional().isDate().withMessage("endDate must be YYYY-MM-DD."),
  query("search").optional().isString().trim().withMessage("Search must be a string."),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  updateUserValidator,
  transactionValidator,
  transactionQueryValidator,
};
