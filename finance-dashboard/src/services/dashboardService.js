const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");
const { Transaction } = require("../models");

// Helper: only count non-deleted transactions
const baseWhere = { isDeleted: false };

// Returns total income, total expenses, and net balance
const getSummary = async () => {
  const results = await Transaction.findAll({
    where: baseWhere,
    attributes: [
      "type",
      [fn("SUM", col("amount")), "total"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["type"],
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  results.forEach((row) => {
    if (row.type === "income") {
      totalIncome = parseFloat(row.dataValues.total) || 0;
      incomeCount = parseInt(row.dataValues.count);
    } else {
      totalExpenses = parseFloat(row.dataValues.total) || 0;
      expenseCount = parseInt(row.dataValues.count);
    }
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    totalTransactions: incomeCount + expenseCount,
  };
};

// Returns totals broken down by category
const getCategoryBreakdown = async () => {
  const results = await Transaction.findAll({
    where: baseWhere,
    attributes: [
      "category",
      "type",
      [fn("SUM", col("amount")), "total"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["category", "type"],
    order: [[literal("total"), "DESC"]],
  });

  return results.map((r) => ({
    category: r.category,
    type: r.type,
    total: parseFloat(r.dataValues.total),
    count: parseInt(r.dataValues.count),
  }));
};

// Returns monthly totals for the last N months (default 6)
const getMonthlyTrends = async (months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);

  const results = await Transaction.findAll({
    where: {
      ...baseWhere,
      date: { [Op.gte]: startDate },
    },
    attributes: [
      [fn("DATE_FORMAT", col("date"), "%Y-%m"), "month"],
      "type",
      [fn("SUM", col("amount")), "total"],
    ],
    group: [literal("month"), "type"],
    order: [[literal("month"), "ASC"]],
  });

  // Restructure into { month, income, expense } objects
  const monthMap = {};
  results.forEach((r) => {
    const month = r.dataValues.month;
    if (!monthMap[month]) monthMap[month] = { month, income: 0, expense: 0 };
    monthMap[month][r.type] = parseFloat(r.dataValues.total);
  });

  return Object.values(monthMap);
};

// Returns the N most recent transactions
const getRecentActivity = async (limit = 5) => {
  const transactions = await Transaction.findAll({
    where: baseWhere,
    order: [["date", "DESC"], ["createdAt", "DESC"]],
    limit,
  });

  return transactions;
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
