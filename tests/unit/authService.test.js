// tests/unit/authService.test.js
// Unit tests for the auth service.
// The User model is mocked so no database connection is needed.

const { generateTestToken, mockUsers } = require("../setup");

// Mock the models module before requiring the service
jest.mock("../../src/models", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const { User } = require("../../src/models");
const authService = require("../../src/services/authService");

describe("Auth Service — register", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw 409 if email already exists", async () => {
    User.findOne.mockResolvedValue(mockUsers.admin); // email already taken

    await expect(
      authService.register({
        name: "Test",
        email: "admin@finance.com",
        password: "pass123",
        role: "viewer",
      })
    ).rejects.toMatchObject({ message: "Email is already registered.", statusCode: 409 });
  });

  it("should create a user and return a token when email is new", async () => {
    User.findOne.mockResolvedValue(null); // email is free
    User.create.mockResolvedValue({
      ...mockUsers.viewer,
      toSafeObject() { return { id: 3, email: "new@example.com", role: "viewer" }; },
    });

    const result = await authService.register({
      name: "New User",
      email: "new@example.com",
      password: "pass123",
      role: "viewer",
    });

    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("user");
    expect(User.create).toHaveBeenCalledTimes(1);
  });
});

describe("Auth Service — login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw 401 if user is not found", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.login({ email: "ghost@example.com", password: "wrong" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("should throw 401 if password is incorrect", async () => {
    User.findOne.mockResolvedValue({
      ...mockUsers.admin,
      comparePassword: async () => false, // wrong password
    });

    await expect(
      authService.login({ email: "admin@finance.com", password: "wrongpass" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("should throw 403 if user account is inactive", async () => {
    User.findOne.mockResolvedValue({
      ...mockUsers.admin,
      status: "inactive",
      comparePassword: async () => true,
    });

    await expect(
      authService.login({ email: "admin@finance.com", password: "admin123" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should return user and token on successful login", async () => {
    User.findOne.mockResolvedValue(mockUsers.admin);

    const result = await authService.login({
      email: "admin@finance.com",
      password: "admin123",
    });

    expect(result).toHaveProperty("token");
    expect(result.user.role).toBe("admin");
  });
});
