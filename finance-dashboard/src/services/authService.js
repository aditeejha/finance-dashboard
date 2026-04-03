const jwt = require("jsonwebtoken");
const { User } = require("../models");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const register = async ({ name, email, password, role }) => {
  // Check if email already exists
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user);

  return { user: user.toSafeObject(), token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (user.status === "inactive") {
    const error = new Error("Your account has been deactivated.");
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user);
  return { user: user.toSafeObject(), token };
};

module.exports = { register, login };
