// tests/unit/transactionService.test.js
// Unit tests for the transaction service.
// The Transaction and User models are mocked — no DB needed.

require("../setup");

jest.mock("../../src/models", () => ({
  Transaction: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {},
}));

const { Transaction } = require("../../src/models");
const transactionService = require("../../src/services/transactionService");

const mockTransaction = {
  id: 1,
  amount: 5000,
  type: "income",
  category: "Salary",
  date: "2025-01-05",
  notes: "Monthly pay",
  isDeleted: false,
  update: jest.fn(),
};

describe("Transaction Service — getAllTransactions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return paginated transactions", async () => {
    Transaction.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [mockTransaction],
    });

    const result = await transactionService.getAllTransactions({}, { page: 1, limit: 10 });

    expect(result.transactions).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("should apply type filter in where clause", async () => {
    Transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await transactionService.getAllTransactions({ type: "expense" }, { page: 1, limit: 10 });

    const callArgs = Transaction.findAndCountAll.mock.calls[0][0];
    expect(callArgs.where.type).toBe("expense");
  });

  it("should apply search filter across category and notes", async () => {
    Transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await transactionService.getAllTransactions({ search: "salary" }, { page: 1, limit: 10 });

    const callArgs = Transaction.findAndCountAll.mock.calls[0][0];
    // Search should produce an Op.or clause
    expect(callArgs.where).toHaveProperty(expect.any(Symbol));
  });
});

describe("Transaction Service — getTransactionById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return a transaction when found", async () => {
    Transaction.findOne.mockResolvedValue(mockTransaction);

    const result = await transactionService.getTransactionById(1);
    expect(result.id).toBe(1);
  });

  it("should throw 404 when transaction does not exist", async () => {
    Transaction.findOne.mockResolvedValue(null);

    await expect(transactionService.getTransactionById(999)).rejects.toMatchObject({
      statusCode: 404,
      message: "Transaction not found.",
    });
  });
});

describe("Transaction Service — createTransaction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create and return a transaction", async () => {
    Transaction.create.mockResolvedValue(mockTransaction);

    const result = await transactionService.createTransaction(
      { amount: 5000, type: "income", category: "Salary", date: "2025-01-05" },
      1
    );

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 1, category: "Salary" })
    );
    expect(result.id).toBe(1);
  });
});

describe("Transaction Service — deleteTransaction (soft delete)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should set isDeleted to true instead of removing the record", async () => {
    Transaction.findOne.mockResolvedValue(mockTransaction);

    const result = await transactionService.deleteTransaction(1);

    expect(mockTransaction.update).toHaveBeenCalledWith({ isDeleted: true });
    expect(result.message).toBe("Transaction deleted successfully.");
  });

  it("should throw 404 when trying to delete a non-existent transaction", async () => {
    Transaction.findOne.mockResolvedValue(null);

    await expect(transactionService.deleteTransaction(999)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
