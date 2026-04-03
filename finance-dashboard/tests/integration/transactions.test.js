// tests/integration/transactions.test.js
// Integration tests for /api/transactions.
// Focuses on access control (which roles can do what) and input validation.

const { generateTestToken, mockUsers } = require("../setup");

jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Transaction: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const request = require("supertest");
const app = require("../../src/app");
const { User, Transaction } = require("../../src/models");

// Tokens for each role
const adminToken   = generateTestToken({ id: 1, role: "admin" });
const analystToken = generateTestToken({ id: 2, role: "analyst" });
const viewerToken  = generateTestToken({ id: 3, role: "viewer" });

const mockTxn = {
  id: 1,
  amount: 5000,
  type: "income",
  category: "Salary",
  date: "2025-01-05",
  notes: "Monthly pay",
  isDeleted: false,
  update: jest.fn().mockResolvedValue(true),
};

// Make auth middleware resolve the correct user based on token role
const setupAuthMock = () => {
  User.findByPk.mockImplementation((id) => {
    const users = { 1: mockUsers.admin, 2: mockUsers.analyst, 3: mockUsers.viewer };
    return Promise.resolve(users[id] || null);
  });
};

describe("GET /api/transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMock();
    Transaction.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockTxn] });
  });

  it("admin can list transactions", async () => {
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.transactions).toHaveLength(1);
  });

  it("analyst can list transactions", async () => {
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("viewer can list transactions", async () => {
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("unauthenticated request is rejected with 401", async () => {
    const res = await request(app).get("/api/transactions");
    expect(res.statusCode).toBe(401);
  });

  it("supports search query param", async () => {
    const res = await request(app)
      .get("/api/transactions?search=salary")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("supports filtering by type", async () => {
    const res = await request(app)
      .get("/api/transactions?type=income")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("rejects invalid type filter with 400", async () => {
    const res = await request(app)
      .get("/api/transactions?type=invalid")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMock();
    Transaction.create.mockResolvedValue(mockTxn);
  });

  const validBody = {
    amount: 5000,
    type: "income",
    category: "Salary",
    date: "2025-01-05",
    notes: "Test",
  };

  it("admin can create a transaction", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.statusCode).toBe(201);
  });

  it("analyst cannot create a transaction — receives 403", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${analystToken}`)
      .send(validBody);
    expect(res.statusCode).toBe(403);
  });

  it("viewer cannot create a transaction — receives 403", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send(validBody);
    expect(res.statusCode).toBe(403);
  });

  it("returns 400 when amount is missing", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, amount: undefined });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when type is invalid", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, type: "transfer" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when date format is wrong", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, date: "01-05-2025" }); // wrong format
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/transactions/:id (soft delete)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMock();
  });

  it("admin can soft delete a transaction", async () => {
    Transaction.findOne.mockResolvedValue(mockTxn);

    const res = await request(app)
      .delete("/api/transactions/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(mockTxn.update).toHaveBeenCalledWith({ isDeleted: true });
  });

  it("viewer cannot delete a transaction", async () => {
    const res = await request(app)
      .delete("/api/transactions/1")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 when transaction does not exist", async () => {
    Transaction.findOne.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/transactions/999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});
