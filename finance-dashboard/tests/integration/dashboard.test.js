// tests/integration/dashboard.test.js
// Tests that dashboard analytics endpoints enforce role-based access correctly.

const { generateTestToken, mockUsers } = require("../setup");

jest.mock("../../src/models", () => ({
  User: { findByPk: jest.fn() },
  Transaction: { findAll: jest.fn() },
}));

const request = require("supertest");
const app = require("../../src/app");
const { User, Transaction } = require("../../src/models");

const adminToken   = generateTestToken({ id: 1, role: "admin" });
const analystToken = generateTestToken({ id: 2, role: "analyst" });
const viewerToken  = generateTestToken({ id: 3, role: "viewer" });

const setupAuthMock = () => {
  User.findByPk.mockImplementation((id) => {
    const map = { 1: mockUsers.admin, 2: mockUsers.analyst, 3: mockUsers.viewer };
    return Promise.resolve(map[id] || null);
  });
};

// Mock summary data returned by Transaction.findAll
const mockSummaryRows = [
  { type: "income",  dataValues: { total: "100000", count: "3" } },
  { type: "expense", dataValues: { total: "40000",  count: "4" } },
];

describe("GET /api/dashboard/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMock();
    Transaction.findAll.mockResolvedValue(mockSummaryRows);
  });

  it("admin can access the summary", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({
      totalIncome: 100000,
      totalExpenses: 40000,
      netBalance: 60000,
    });
  });

  it("analyst can access the summary", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("viewer is forbidden from the summary — receives 403", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

  it("unauthenticated request is rejected with 401", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/dashboard/categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMock();
    Transaction.findAll.mockResolvedValue([
      { category: "Salary", type: "income", dataValues: { total: "100000", count: "2" } },
    ]);
  });

  it("admin can access category breakdown", async () => {
    const res = await request(app)
      .get("/api/dashboard/categories")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].category).toBe("Salary");
  });

  it("viewer is blocked from category breakdown", async () => {
    const res = await request(app)
      .get("/api/dashboard/categories")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/dashboard/recent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMock();
    Transaction.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  it("analyst can access recent activity", async () => {
    const res = await request(app)
      .get("/api/dashboard/recent")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
