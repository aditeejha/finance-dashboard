const authService = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: "User registered successfully.", data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, message: "Login successful.", data: result });
  } catch (err) {
    next(err);
  }
};

// Returns the currently logged-in user's profile
const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user.toSafeObject() });
};

module.exports = { register, login, getMe };
