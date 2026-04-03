// tests/integration/auth.test.js
// Integration tests for POST /api/auth/register and POST /api/auth/login.
// The User model is mocked so the real DB is not needed.

const { generateTestToken, mockUsers } = require("../setup");

jest.mock("../../src/models", () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Transaction: {},
}));

const request = require("supertest");
const app = require("../../src/app");
const { User } = require("../../src/models");

describe("POST /api/auth/register", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 201 and a token on successful registration", async () => {
    User.findOne.mockResolvedValue(null); // no existing user
    User.create.mockResolvedValue({
      ...mockUsers.viewer,
      toSafeObject() { return { id: 3, name: "New User", role: "viewer" }; },
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "New User",
      email: "newuser@example.com",
      password: "password123",
      role: "viewer",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
  });

  it("should return 409 when email is already registered", async () => {
    User.findOne.mockResolvedValue(mockUsers.admin);

    const res = await request(app).post("/api/auth/register").send({
      name: "Dup User",
      email: "admin@finance.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "incomplete@example.com",
      // missing name and password
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 400 when password is too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Short Pass",
      email: "shortpass@example.com",
      password: "abc", // less than 6 chars
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe("password");
  });

  it("should return 400 for an invalid role value", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Role",
      email: "badrole@example.com",
      password: "password123",
      role: "superuser", // not a valid role
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 200 and a token on valid credentials", async () => {
    User.findOne.mockResolvedValue(mockUsers.admin);

    const res = await request(app).post("/api/auth/login").send({
      email: "admin@finance.com",
      password: "admin123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.role).toBe("admin");
  });

  it("should return 401 on wrong password", async () => {
    User.findOne.mockResolvedValue({
      ...mockUsers.admin,
      comparePassword: async () => false,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "admin@finance.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 when user does not exist", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@example.com",
      password: "doesnotmatter",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should return 400 when email format is invalid", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return the current user's profile when authenticated", async () => {
    User.findByPk.mockResolvedValue(mockUsers.admin);

    const token = generateTestToken({ role: "admin" });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.role).toBe("admin");
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});
