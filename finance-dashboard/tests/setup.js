// tests/setup.js
// Shared test utilities used across all test files.
// Tests run against the real app but use mocked services so no DB is needed.

const jwt = require("jsonwebtoken");

// Set a test JWT secret before any module loads
process.env.JWT_SECRET = "test_secret_key_for_jest";
process.env.NODE_ENV = "test";

/**
 * Generate a valid JWT token for a mock user.
 * Used to authenticate requests in tests without hitting the DB.
 */
const generateTestToken = (overrides = {}) => {
  const payload = {
    id: overrides.id || 1,
    email: overrides.email || "test@example.com",
    role: overrides.role || "admin",
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

/**
 * Mock user objects for the three roles.
 */
const mockUsers = {
  admin: {
    id: 1,
    name: "Admin User",
    email: "admin@finance.com",
    role: "admin",
    status: "active",
    toSafeObject() { return this; },
    comparePassword: async () => true,
  },
  analyst: {
    id: 2,
    name: "Analyst User",
    email: "analyst@finance.com",
    role: "analyst",
    status: "active",
    toSafeObject() { return this; },
    comparePassword: async () => true,
  },
  viewer: {
    id: 3,
    name: "Viewer User",
    email: "viewer@finance.com",
    role: "viewer",
    status: "active",
    toSafeObject() { return this; },
    comparePassword: async () => true,
  },
};

module.exports = { generateTestToken, mockUsers };
