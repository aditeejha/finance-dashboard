// tests/unit/dashboardService.test.js
// Unit tests for dashboard aggregation logic.

require("../setup");

jest.mock("../../src/models", () => ({
  Transaction: {
    findAll: jest.fn(),
  },
}));

const { Transaction } = require("../../src/models");
const dashboardService = require("../../src/services/dashboardService");

describe("Dashboard Service — getSummary", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should calculate totals and net balance correctly", async () => {
    Transaction.findAll.mockResolvedValue([
      { type: "income",  dataValues: { total: "120000", count: "3" } },
      { type: "expense", dataValues: { total: "45000",  count: "5" } },
    ]);

    const result = await dashboardService.getSummary();

    expect(result.totalIncome).toBe(120000);
    expect(result.totalExpenses).toBe(45000);
    expect(result.netBalance).toBe(75000);
    expect(result.totalTransactions).toBe(8);
  });

  it("should return zero values when there are no transactions", async () => {
    Transaction.findAll.mockResolvedValue([]);

    const result = await dashboardService.getSummary();

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netBalance).toBe(0);
    expect(result.totalTransactions).toBe(0);
  });

  it("should handle income-only scenario (no expenses)", async () => {
    Transaction.findAll.mockResolvedValue([
      { type: "income", dataValues: { total: "50000", count: "2" } },
    ]);

    const result = await dashboardService.getSummary();

    expect(result.totalIncome).toBe(50000);
    expect(result.totalExpenses).toBe(0);
    expect(result.netBalance).toBe(50000);
  });
});

describe("Dashboard Service — getCategoryBreakdown", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return category totals correctly", async () => {
    Transaction.findAll.mockResolvedValue([
      { category: "Salary",  type: "income",  dataValues: { total: "100000", count: "2" } },
      { category: "Rent",    type: "expense", dataValues: { total: "24000",  count: "2" } },
    ]);

    const result = await dashboardService.getCategoryBreakdown();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ category: "Salary", type: "income", total: 100000 });
    expect(result[1]).toMatchObject({ category: "Rent", type: "expense", total: 24000 });
  });
});

describe("Dashboard Service — getRecentActivity", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return the most recent transactions up to the limit", async () => {
    const mockRows = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
    Transaction.findAll.mockResolvedValue(mockRows);

    const result = await dashboardService.getRecentActivity(5);

    expect(Transaction.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 })
    );
    expect(result).toHaveLength(5);
  });
});
